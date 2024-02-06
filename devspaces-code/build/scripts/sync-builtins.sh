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
MODIFIED_RIPGREP_MANIFEST=0

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

REMOTE_USER_AND_HOST="devspaces-build@spmm-util.engineering.redhat.com"
BASE_URL="https://download.devel.redhat.com/rcm-guest/staging/devspaces/build-requirements"

SCRIPTS_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ $SCRIPTS_BRANCH != "devspaces-3."*"-rhel-8" ]]; then SCRIPTS_BRANCH="devspaces-3-rhel-8"; fi

replaceField()
{
  updateName="$1"
  updateVal="$2"
  fileName="$3"

  changed=$(cat $fileName | jq "${updateName} |= $updateVal")
  echo "${changed}" > $fileName
}

addRipGrepLibrary() {
  RG_VERSION=$1
  RG_SHA=""
  RG_REMOTE_SHA=""
  RG_MANIFEST_SHA=""

  RG_SOURCE_SHA=""
  RG_REMOTE_SOURCE_SHA=""
  RG_MANIFEST_SOURCE_SHA=""
  for rcm_version in "${AVAILABLE_RG_VERSIONS[@]}"
  do
    rcm_version=$(echo $rcm_version | tr -d '\n')
    case $platform in
      'powerpc64le') RG_ARCH_SUFFIX='powerpc64le-unknown-linux-gnu';;
      's390x') RG_ARCH_SUFFIX='s390x-unknown-linux-gnu';;
      'x86_64') RG_ARCH_SUFFIX='x86_64-unknown-linux-musl';;
    esac
    RG_REMOTE_LOCATION="$BASE_URL/common/ripgrep-multiarch/${RG_VERSION}/ripgrep-${RG_VERSION}-${RG_ARCH_SUFFIX}.tar.gz"
    RG_REMOTE_SOURCE_LOCATION="https://github.com/microsoft/ripgrep-prebuilt/archive/refs/tags/${RG_VERSION}.tar.gz"
    if [[ "${rcm_version}" == "${RG_VERSION}" ]]; then
      echo "[info] found required ripgrep-prebuilt in manifest ${RG_VERSION} for ${platform} platform"
      # fetch files and verify the true SHA
      curl -sLo /tmp/ripgrep-${platform}-${RG_VERSION}.tar.gz $RG_REMOTE_LOCATION
      curl -sLo /tmp/ripgrep-${platform}-${RG_VERSION}-sources.tar.gz $RG_REMOTE_SOURCE_LOCATION
      if [[ $(file -b /tmp/ripgrep-${platform}-${RG_VERSION}.tar.gz) != *"gzip compressed data"* 
      && $(file -b /tmp/ripgrep-${platform}-${RG_VERSION}-sources.tar.gz) != *"gzip compressed data"* ]]; then
        # files are corrupt, and we have to recreate it
        echo "[info] file is not an archive, so it will be recreated"
      else
        RG_REMOTE_SHA=$(sha256sum /tmp/ripgrep-${platform}-${RG_VERSION}.tar.gz)
        RG_REMOTE_SHA=${RG_REMOTE_SHA:0:64}

        RG_REMOTE_SOURCE_SHA=$(sha256sum /tmp/ripgrep-${platform}-${RG_VERSION}-sources.tar.gz)
        RG_REMOTE_SOURCE_SHA=${RG_REMOTE_SOURCE_SHA:0:64}

        RG_MANIFEST_SHA=$(jq -r ".\"${rcm_version}\".\"${platform}\".sha" /tmp/manifest.json)
        RG_MANIFEST_SOURCE_SHA=$(jq -r ".\"${rcm_version}\".\"${platform}\".source_sha" /tmp/manifest.json)
        # if actual SHA and SHA in manifest are different, we need to update the manifest
        if [[ "${RG_REMOTE_SHA}" != "${RG_MANIFEST_SHA}" ]]; then
          echo "[info] detected SHA mismatch: manifest:${RG_MANIFEST_SHA}, actual:${RG_REMOTE_SHA}"
          replaceField ".\"${RG_VERSION}\".\"${platform}\".sha" "\"$RG_REMOTE_SHA\"" /tmp/manifest.json
          MODIFIED_RIPGREP_MANIFEST=1
        fi
        if [[ "${RG_REMOTE_SOURCE_SHA}" != "${RG_MANIFEST_SOURCE_SHA}" ]]; then
          echo "[info] detected SHA mismatch: manifest:${RG_MANIFEST_SOURCE_SHA}, actual:${RG_REMOTE_SOURCE_SHA}"
          replaceField ".\"${RG_VERSION}\".\"${platform}\".source_sha" "\"$RG_REMOTE_SOURCE_SHA\"" /tmp/manifest.json
          MODIFIED_RIPGREP_MANIFEST=1
        fi
        RG_SHA=$RG_REMOTE_SHA
        RG_SOURCE_SHA=$RG_REMOTE_SOURCE_SHA
      fi
      echo "[info] sha: ${RG_SHA}"
      echo "[info] source_sha: ${RG_SOURCE_SHA}"
      echo "################################################"
      #rm /tmp/ripgrep-${platform}-${RG_VERSION}.tar.gz
      #rm /tmp/ripgrep-${platform}-${RG_VERSION}-sources.tar.gz
      break
    fi
  done
  if [[ $RG_SHA == "" ]]; then
    echo "[info] Did not find required ripgrep-prebuilt ${RG_VERSION} for ${platform} platform"
    echo "[info] Download and push to rcm-tools: "
    if [[ ! -f /tmp/uploadBuildRequirementsToSpmmUtil.sh ]]; then
      curl -sSL https://raw.githubusercontent.com/redhat-developer/devspaces/${SCRIPTS_BRANCH}/product/uploadBuildRequirementsToSpmmUtil.sh -o /tmp/uploadBuildRequirementsToSpmmUtil.sh
      chmod +x /tmp/uploadBuildRequirementsToSpmmUtil.sh
    fi
    if [[ $NO_OP != 1 ]]; then
      RG_PUBLISH_FLAG="--publish"
    fi
    /tmp/uploadBuildRequirementsToSpmmUtil.sh -u https://github.com/microsoft/ripgrep-prebuilt/releases/download -ad ripgrep-multiarch -as ripgrep --arches "${RG_ARCH_SUFFIX}" --debug ${RG_PUBLISH_FLAG} -v ${RG_VERSION}
    RG_LOCAL_LOCATION=/tmp/build-requirements/common/ripgrep-multiarch/${RG_VERSION}/ripgrep-${RG_VERSION}-${RG_ARCH_SUFFIX}.tar.gz
    if [[ $NO_OP -eq 1 ]]; then
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
    MODIFIED_RIPGREP_MANIFEST=1
  fi

  # generate parts of fetch-artifacts for this platform
  echo "#ripgrep-${platform}
- url: $RG_REMOTE_LOCATION
  sha256: $RG_SHA
  source-url: $RG_REMOTE_SOURCE_LOCATION
  source-sha256: $RG_SOURCE_SHA" >> ${TARGETDIR}/fetch-artifacts-url.yaml
}

addRipGrepToYaml() {
  #fetch post-install script for vscode ripgrep extension, in which we find the required version of ripgrep
  VSCODE_RIPGREP_VERSION=$(cd "$TARGETDIR"/code; yarn list --frozen-lockfile --pattern vscode/ripgrep --depth=0 --flat | grep -o -E @vscode/ripgrep@\\S* | cut -d '@' -f 3)
  # cache directory in brew.Dockerfile must be updated according to this version
  sed -r -e "s|(COPY artifacts/ripgrep-\*.tar.gz /tmp/vscode-ripgrep-cache-).*|\1${VSCODE_RIPGREP_VERSION}/|" -i "${TARGETDIR}/build/dockerfiles/brew.Dockerfile"
  POST_INSTALL_SCRIPT=$(curl -sSL https://raw.githubusercontent.com/microsoft/vscode-ripgrep/v${VSCODE_RIPGREP_VERSION}/lib/postinstall.js)
  VSIX_RIPGREP_PREBUILT_VERSION=$(echo "${POST_INSTALL_SCRIPT}" | grep "const VERSION" | cut -d"'" -f 2 )
  VSIX_RIPGREP_PREBUILT_MULTIARCH_VERSION=$(echo "${POST_INSTALL_SCRIPT}" | grep "const MULTI_ARCH_LINUX_VERSION" | cut -d"'" -f 2 )
  echo "[info] vscode-ripgrep dependency version: ${VSCODE_RIPGREP_VERSION} depends on ripgrep-prebuilt ${VSIX_RIPGREP_PREBUILT_VERSION}, multiarch - ${VSIX_RIPGREP_PREBUILT_MULTIARCH_VERSION}"
  # collect all current available versions on rcm-tools
  # TODO fix duplicate 'ripgrep-multiarch'
  curl -sSL https://download.devel.redhat.com/rcm-guest/staging/devspaces/build-requirements/common/ripgrep-multiarch/manifest.json -o /tmp/manifest.json
  if ! jq empty /tmp/manifest.json; then
    echo "[error] could not download manifest.json from https://download.devel.redhat.com/rcm-guest/staging/devspaces/build-requirements/common/" 
    exit 1
  fi
  readarray -d ' ' -t AVAILABLE_RG_VERSIONS < <(jq -r "keys | @sh" /tmp/manifest.json | tr -d \')
  for platform in "s390x" "powerpc64le" "x86_64"; do
    if [[ ${platform} == "s390x" || ${platform} == "powerpc64le" ]]; then
      addRipGrepLibrary "${VSIX_RIPGREP_PREBUILT_MULTIARCH_VERSION}"
    else
      addRipGrepLibrary "${VSIX_RIPGREP_PREBUILT_VERSION}"
    fi
  done
  # publish manifest only or print it if in no-op mode
  if [[ $NO_OP != 1 ]]; then
    if [[ $MODIFIED_RIPGREP_MANIFEST -eq 1 ]]; then
      if [[ ! "${WORKSPACE}" ]]; then WORKSPACE=/tmp; fi
      SYNC_DIR=/build-requirements/common/ripgrep-multiarch
      rm -f ${WORKSPACE}/${SYNC_DIR} || true
      mkdir -p ${WORKSPACE}/${SYNC_DIR}
      mv /tmp/manifest.json ${WORKSPACE}/${SYNC_DIR}
      rsync -rlP ${WORKSPACE}/${SYNC_DIR}/ ${REMOTE_USER_AND_HOST}:staging/devspaces/${SYNC_DIR}
    fi
  else
    echo "[info] NO-OP mode - printing resulting manifest:"
    cat /tmp/manifest.json
  fi

  rm -f /tmp/manifest.json
  rm -rf /tmp/build-requirements
}

addVscodePluginsToYaml () {
  # TODO better handling for git repo cleanup?
  rm -rf /tmp/devspaces-vscode-extensions || true

  git clone https://github.com/redhat-developer/devspaces-vscode-extensions /tmp/devspaces-vscode-extensions  
  pushd /tmp/devspaces-vscode-extensions >/dev/null
    # configure repository for pushing from Jenkins
    git config user.email "nickboldt+devstudio-release@gmail.com"
    git config user.name "devstudio-release"
    git config --global push.default matching
    git config --global pull.rebase true
    git config --global hub.protocol https
    git remote set-url origin https://$GITHUB_TOKEN:x-oauth-basic@github.com/redhat-developer/devspaces-vscode-extensions.git
  popd >/dev/null
  PLUGINS=$(jq -r '.builtInExtensions[] | .name' "$TARGETDIR"/code/product.json)
  # check if vsix plugin version listed in synced sources as dependency
  # has corresponding version on rcm tools
  for PLUGIN in $PLUGINS; do
    PLUGIN_SHA=""
    PLUGIN_REMOTE_SHA=""
    PLUGIN_MANIFEST_SHA=""

    SOURCE_SHA=""
    PLUGIN_REMOTE_SOURCE_SHA=""
    PLUGIN_MANIFEST_SOURCE_SHA=""

    PLUGIN_LOCATION=$BASE_URL/devspaces-$DS_VERSION-pluginregistry/plugins/$PLUGIN.vsix
    SOURCE_LOCATION=$BASE_URL/devspaces-$DS_VERSION-pluginregistry/sources/$PLUGIN-sources.tar.gz
    # plugin "version" in product.json can be different from 
    # match version in sources with version in manifest
    # if mismatch is found, then fill SHA values with undefined
    AVAILABLE_VSIX_VERSION=$(jq -r ".Plugins.\"$PLUGIN\".revision" /tmp/devspaces-vscode-extensions/plugin-config.json)
    AVAILABLE_VSIX_VERSION_NO_PREFIX=${AVAILABLE_VSIX_VERSION#v}
    REQUIRED_VSIX_VERSION=$(jq -r ".builtInExtensions[] | select( .name==\"${PLUGIN}\") | .version" "$TARGETDIR"/code/product.json)
    echo "[info] looking for plugin \"${PLUGIN}\", version ${REQUIRED_VSIX_VERSION}" 
    if [[ $REQUIRED_VSIX_VERSION == ${AVAILABLE_VSIX_VERSION_NO_PREFIX} ]]; then
      echo "[info] found required vsix extension in manifest - ${PLUGIN}, version ${REQUIRED_VSIX_VERSION}"
      # donwload plugin and sources to check if they exists, and evaluate their SHA
      curl -sLo /tmp/${plugin}.vsix $PLUGIN_LOCATION
      curl -sLo /tmp/${plugin}-sources.tar.gz $SOURCE_LOCATION
      if [[ $(file -b /tmp/${plugin}.vsix) != *"Zip archive data"* 
      && $(file -b /tmp/${plugin}-sources.tar.gz) != *"gzip compressed data"* ]]; then
        # files are corrupt, and we have to recreate it
        echo "[info] file is not an archive, so it will be recreated"
      else
        PLUGIN_REMOTE_SHA=$(sha256sum /tmp/${plugin}.vsix)
        PLUGIN_REMOTE_SHA=${PLUGIN_REMOTE_SHA:0:64}

        PLUGIN_REMOTE_SOURCE_SHA=$(sha256sum /tmp/${plugin}-sources.tar.gz)
        PLUGIN_REMOTE_SOURCE_SHA=${PLUGIN_REMOTE_SOURCE_SHA:0:64}

        PLUGIN_MANIFEST_SHA=$(cat /tmp/devspaces-vscode-extensions/plugin-manifest.json | jq -r ".Plugins[\"$PLUGIN\"][\"vsix\"]")
        PLUGIN_MANIFEST_SOURCE_SHA=$(cat /tmp/devspaces-vscode-extensions/plugin-manifest.json | jq -r ".Plugins[\"$PLUGIN\"][\"source\"]")
        # if actual SHA and SHA in manifest are different, we need to update the manifest
        if [[ "${PLUGIN_REMOTE_SHA}" != "${PLUGIN_MANIFEST_SHA}" ]]; then
          #TODO add manifest update code
          echo "[info] updating manifest"
        fi
        if [[ "${PLUGIN_REMOTE_SOURCE_SHA}" != "${PLUGIN_MANIFEST_SOURCE_SHA}" ]]; then
          #TODO add manifest update code
          echo "[info] updating manifest"
        fi
      fi
      PLUGIN_SHA=$PLUGIN_REMOTE_SHA
      SOURCE_SHA=$PLUGIN_REMOTE_SOURCE_SHA
      echo "[info] sha: ${PLUGIN_SHA}"
      echo "[info] source_sha: ${SOURCE_SHA}"
      echo "################################################"
    fi
    if [[ $PLUGIN_SHA == "" ]]; then
      echo "[info] not found required ripgrep prebuilt extension for ${REQUIRED_VSIX_VERSION}"
      echo "[info] downloading and publishing to rcm-tools now"
      pushd /tmp/devspaces-vscode-extensions >/dev/null
        git checkout "${SCRIPTS_BRANCH}"
        git stash
        git pull
        git stash pop || true

        replaceField ".Plugins.\"${PLUGIN}\".revision" "\"v${REQUIRED_VSIX_VERSION}\"" /tmp/devspaces-vscode-extensions/plugin-config.json
        ./build/build.sh "$PLUGIN" --update-manifest

        PLUGIN_SHA=$(sha256sum "${PLUGIN}.vsix")
        PLUGIN_SHA=${PLUGIN_SHA:0:64}

        SOURCE_SHA=$(sha256sum "${PLUGIN}-sources.tar.gz")
        SOURCE_SHA=${SOURCE_SHA:0:64}

        echo "[info] sha: ${PLUGIN_SHA}"
        echo "[info] source_sha: ${SOURCE_SHA}"
        echo "################################################"
          if [[ $NO_OP != 1 ]]; then
            if [ ! -f /tmp/copyVSIXToStage.sh ]; then
              curl -sSL https://raw.githubusercontent.com/redhat-developer/devspaces/${SCRIPTS_BRANCH}/product/copyVSIXToStage.sh -o /tmp/copyVSIXToStage.sh
              chmod +x /tmp/copyVSIXToStage.sh
            fi
            /tmp/copyVSIXToStage.sh -b ${MIDSTM_BRANCH} -v ${DS_VERSION}
            git add plugin-config.json
            git add plugin-manifest.json
            git commit -sm "ci: Update plugin-manifest data for ${PLUGIN}"
            git push origin "${SCRIPTS_BRANCH}"
          else
            echo "[info] show diff in resulting manifest:"
            git --no-pager diff
          fi
      popd >/dev/null

    fi
    echo "#$PLUGIN
- url: $BASE_URL/devspaces-$DS_VERSION-pluginregistry/plugins/$PLUGIN.vsix
  sha256: $PLUGIN_SHA
  source-url: $BASE_URL/devspaces-$DS_VERSION-pluginregistry/sources/$PLUGIN-sources.tar.gz
  source-sha256: $SOURCE_SHA" >> "${TARGETDIR}/fetch-artifacts-url.yaml"
  done
  rm -rf /tmp/devspaces-vscode-extensions || true
}

# delete everything in fetch-artifacts-url.yaml except the first line
echo "# This file is autogenerated by sync-builtins.sh" > "${TARGETDIR}/fetch-artifacts-url.yaml"
addRipGrepToYaml
addVscodePluginsToYaml

