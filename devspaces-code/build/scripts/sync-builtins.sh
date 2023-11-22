#!/bin/bash
#
# Copyright (c) 2022-2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

set -e

NO_OP=0

usage () {
	echo "Usage:   ${0##*/} -v [DS_VERSION]  [-t /path/to/generated]"
	echo "Example: ${0##*/} -v 3.11 -t /tmp/devspaces-operator"
	echo "Parameters:
  -t                - sync target directory
  -v, --ds-version  - DS version in 3.x format (e.g. 3.11)
  -n, --no-op       - run this script in no-op mode (download and edit things locally, but do not push/publish anything)
	"
	exit
}

if [[ $# -lt 4 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
	'-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
	'--help'|'-h') usage;;
	'--no-op'|'-n') NO_OP=1;;
	'--ds-version'|'-v') DS_VERSION="$2"; shift 1;;
  esac
  shift 1
done

REMOTE_USER_AND_HOST="devspaces-build@spmm-util.hosts.stage.psi.bos.redhat.com"
BASE_URL="https://download.devel.redhat.com/rcm-guest/staging/devspaces/build-requirements"

if [[ $SCRIPTS_BRANCH != "devspaces-3."*"-rhel-8" ]]; then SCRIPTS_BRANCH="devspaces-3-rhel-8"; fi

replaceField()
{
  updateName="$1"
  updateVal="$2"
  fileName="$3"

  changed=$(cat $fileName | jq "${updateName} |= $updateVal")
  echo "${changed}" > $fileName
}

sed_in_place() {
    SHORT_UNAME=$(uname -s)
  if [ "$(uname)" == "Darwin" ]; then
    sed -i '' "$@"
  elif [ "${SHORT_UNAME:0:5}" == "Linux" ]; then
    sed -i "$@"
  fi
}

addRipGrepLibrary() {
  RG_VERSION=$1
  RG_SHA=""
  RG_SOURCE_SHA=""
  for rcm_version in "${AVAILABLE_RG_VERSIONS[@]}"
  do
    if [[ "${rcm_version}" == "${RG_VERSION}" ]]; then
      echo "[info] found required ripgrep-prebuilt ${RG_VERSION} for ${platform} platform"
      RG_SHA=$(jq ".\"${rcm_version}\".\"${platform}\".sha" /tmp/manifest.json)
      RG_SOURCE_SHA=$(jq ".\"${rcm_version}\".\"${platform}\".source_sha" /tmp/manifest.json)
      echo "[info] sha: ${RG_SHA}"
      echo "[info] source_sha: ${RG_SOURCE_SHA}"
      echo "################################################"
      break
    fi
  done
  case $platform in
    'powerpc64le') RG_ARCH_SUFFIX='powerpc64le-unknown-linux-gnu';;
    's390x') RG_ARCH_SUFFIX='s390x-unknown-linux-gnu';;
    'x86_64') RG_ARCH_SUFFIX='x86_64-unknown-linux-musl';;
  esac
  RG_REMOTE_LOCATION="$BASE_URL/common/ripgrep-multiarch/${RG_VERSION}/ripgrep-${RG_VERSION}-${RG_ARCH_SUFFIX}.tar.gz"
  if [[ $RG_SHA == "" ]]; then
    echo "[info] not found required ripgrep-prebuilt ${RG_VERSION} for ${platform} platform"
    echo "[info] downloading and publishing to rcm-tools now"
    curl -sSL https://raw.githubusercontent.com/redhat-developer/devspaces/${SCRIPTS_BRANCH}/product/uploadBuildRequirementsToSpmmUtil.sh -o /tmp/uploadBuildRequirementsToSpmmUtil.sh
    chmod +x /tmp/uploadBuildRequirementsToSpmmUtil.sh
    if [[ NO_OP != 1 ]]; then
      RG_PUBLISH_FLAG="--publish"
    fi
    /tmp/uploadBuildRequirementsToSpmmUtil.sh -u https://github.com/microsoft/ripgrep-prebuilt/releases/download -ad ripgrep-multiarch -as ripgrep --arches "${RG_ARCH_SUFFIX}" --debug ${RG_PUBLISH_FLAG} -v ${RG_VERSION}
    RG_LOCAL_LOCATION=/tmp/build-requirements/common/ripgrep-multiarch/${RG_VERSION}/ripgrep-${RG_VERSION}-${RG_ARCH_SUFFIX}.tar.gz
    if [[ NO_OP -eq 1 ]]; then
      echo "[info] NO-OP mode - showing file"
      echo "[info] $(ls -l ${RG_LOCAL_LOCATION})"
    fi
    RG_SHA=$(sha256sum "${RG_LOCAL_LOCATION}" | tr -d \' )
    RG_SHA=${RG_SHA:0:64}

    RG_SOURCE_SHA=$(curl -s https://github.com/microsoft/ripgrep-prebuilt/archive/refs/tags/${RG_VERSION}.tar.gz | sha256sum | tr -d \')
    RG_SOURCE_SHA=${RG_SOURCE_SHA:0:64}
    echo "[info] updating manifest with new ripgrep prebuild ${RG_VERSION}"
    echo "[info] sha: ${RG_SHA}"
    echo "[info] source_sha: ${RG_SOURCE_SHA}"
    echo "################################################"
    replaceField ".\"${RG_VERSION}\".\"${platform}\".sha" "\"$RG_SHA\"" /tmp/manifest.json
    replaceField ".\"${RG_VERSION}\".\"${platform}\".source_sha" "\"$RG_SOURCE_SHA\"" /tmp/manifest.json
  fi

  # generate parts of fetch-artifacts for this platform
  echo "#ripgrep-${platform}
- url: $RG_REMOTE_LOCATION
  sha256: $RG_SHA
  source-url: $BASE_URL/devspaces-$DS_VERSION-pluginregistry/sources/$PLUGIN-sources.tar.gz
  source-sha256: $RG_SOURCE_SHA" >> ${TARGETDIR}/fetch-artifacts-url.yaml
}

addRipGrepToYaml() {
  #fetch post-install script for vscode ripgrep extension, in which we find the required version of ripgrep
  VSCODE_RIPGREP_VERSION=$(cat ${TARGETDIR}/code/package.json | jq -r '.dependencies."@vscode/ripgrep"' | tr -d ^ )
  POST_INSTALL_SCRIPT=$(curl -sSL https://raw.githubusercontent.com/microsoft/vscode-ripgrep/v${VSCODE_RIPGREP_VERSION}/lib/postinstall.js)
  VSIX_RIPGREP_PREBUILT_VERSION=$(echo "${POST_INSTALL_SCRIPT}" | grep "const VERSION" | cut -d"'" -f 2 | tr -d v )
  echo "[info] vscode-ripgrep dependency version: ${VSCODE_RIPGREP_VERSION} depends on ripgrep-prebuilt ${VSIX_RIPGREP_PREBUILT_VERSION}"
  # collect all current available versions on rcm-tools
  # TODO fix duplicate 'ripgrep-multiarch'
  curl -sSL https://download.devel.redhat.com/rcm-guest/staging/devspaces/build-requirements/common/ripgrep-multiarch/ripgrep-multiarch/manifest.json -o /tmp/manifest.json
  if ! jq empty /tmp/manifest.json; then
    echo "[error] could not download manifest.json from rcm-tools" 
    exit 1
  fi
  readarray -d ' ' -t AVAILABLE_RG_VERSIONS < <(jq --raw-output "keys | @sh" /tmp/manifest.json | tr -d \')
  for platform in "s390x" "powerpc64le" "x86_64"; do
    addRipGrepLibrary "${VSIX_RIPGREP_PREBUILT_VERSION}"
    # CRW-4938 add additional versions of ripgrep here
    if [[ $platform == "s390x" ]]; then
      addRipGrepLibrary "13.0.0-4"
    fi
  done
  # publish manifest only or print it if in no-op mode
  if [[ $NO_OP != 1 ]]; then
    if [[ ! "${WORKSPACE}" ]]; then WORKSPACE=/tmp; fi
    SYNC_DIR=/build-requirements/build-requirements/common/ripgrep-multiarch
    rm -f ${WORKSPACE}/${SYNC_DIR} || true
    mkdir -p ${WORKSPACE}/${SYNC_DIR}
    mv /tmp/manifest.json ${WORKSPACE}/${SYNC_DIR}
    rsync -rlP ${WORKSPACE}/${SYNC_DIR} ${REMOTE_USER_AND_HOST}:staging/devspaces/${SYNC_DIR}
  else
    echo "[info] NO-OP mode - printing resulting manifest:"
    cat /tmp/manifest.json
  fi

  rm -f /tmp/manifest.json
  rm -rf /tmp/build-requirements
}

addVscodePluginsToYaml () {
  SCRIPTS_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  curl -sSL https://raw.githubusercontent.com/redhat-developer/devspaces-vscode-extensions/${SCRIPTS_BRANCH}/plugin-manifest.json --output /tmp/plugin-manifest.json
  curl -sSL https://raw.githubusercontent.com/redhat-developer/devspaces-vscode-extensions/${SCRIPTS_BRANCH}/plugin-config.json --output /tmp/plugin-config.json

  PLUGINS=$(cat /tmp/plugin-manifest.json | jq -r '.Plugins | keys[]')
  # check if vsix plugin version listed in synced sources as dependency
  # has corresponding version on rcm tools
  for PLUGIN in $PLUGINS; do
    #filter out non built-in plugins
    if [[ $PLUGIN != "ms-vscode"* ]]; then
      continue
    fi
    # match version in sources with version in manifest
    # if mismatch is found, then fill SHA values with undefined
    AVAILABLE_VSIX_VERSION=$(cat /tmp/plugin-config.json | jq -r ".Plugins.\"$PLUGIN\".revision")
    AVAILABLE_VSIX_VERSION=${AVAILABLE_VSIX_VERSION#v}
    echo "[info] looking for plugin \"${PLUGIN}\", version ${AVAILABLE_VSIX_VERSION}"
    REQUIRED_VSIX_VERSION=$(cat $TARGETDIR/code/product.json | jq -r ".builtInExtensions[] | select( .name==\"${PLUGIN}\") | .version")
    if [[ $REQUIRED_VSIX_VERSION == ${AVAILABLE_VSIX_VERSION} ]]; then
      echo "[info] found required vsix extension - ${PLUGIN}, version ${REQUIRED_VSIX_VERSION}"
      PLUGIN_SHA=$(cat /tmp/plugin-manifest.json | jq -r ".Plugins[\"$PLUGIN\"][\"vsix\"]")
      SOURCE_SHA=$(cat /tmp/plugin-manifest.json | jq -r ".Plugins[\"$PLUGIN\"][\"source\"]")
      echo "[info] sha: ${RG_SHA}"
      echo "[info] source_sha: ${RG_SOURCE_SHA}"
      echo "################################################"
    else
      echo "[info] not found required ripgrep prebuilt extension for ${REQUIRED_VSIX_VERSION}"
      echo "[info] downloading and publishing"
      if [[ ! -f /tmp/redhat-vscode-extensions ]]; then
        git clone git@github.com:redhat-developer/devspaces-vscode-extensions
      fi
      pushd /tmp/redhat-vscode-extensions >/dev/null
        git checkout ${SCRIPTS_BRANCH}
        # build vsix plugin
        ./build/build.sh $PLUGIN
        echo "[info] sha: ${RG_SHA}"
        echo "[info] source_sha: ${RG_SOURCE_SHA}"
        echo "################################################"
          if [[ $NO_OP != 1 ]]; then
            #push updated manifest
            git add plugin-manifest.json
            git commit -sm "ci: Update plugin-manifest"
            ./copyVSIXToStage.sh -b ${MIDSTM_BRANCH} -v ${DS_VERSION}
          else
            echo "[info] printing resulting manifest:"
            cat /tmp/manifest.json
          fi
        #update plugin-manifest
        # git add plugin-manifest.json
        # git commit -sm "[update plugin-manifest"
      popd >/dev/null

      # TODO upload new version
    fi
    echo "#$PLUGIN
- url: $BASE_URL/devspaces-$DS_VERSION-pluginregistry/plugins/$PLUGIN.vsix
  sha256: $PLUGIN_SHA
  source-url: $BASE_URL/devspaces-$DS_VERSION-pluginregistry/sources/$PLUGIN-sources.tar.gz
  source-sha256: $SOURCE_SHA" >> ${TARGETDIR}/fetch-artifacts-url.yaml
  done
  #rm /tmp/plugin-manifest.json
  rm -r /tmp/redhat-vscode-extensions || true
}

### MAIN ###
sed_in_place '0,/# This file is autogenerated by sync-builtins.sh/!d' ${TARGETDIR}/fetch-artifacts-url.yaml
addRipGrepToYaml
addVscodePluginsToYaml