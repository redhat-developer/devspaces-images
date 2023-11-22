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

REMOTE_USER_AND_HOST="devspaces-build@spmm-util.hosts.stage.psi.bos.redhat.com"
BASE_URL="https://download.devel.redhat.com/rcm-guest/staging/devspaces/build-requirements"

replaceField()
{
  updateName="$1"
  updateVal="$2"
  fileName="$3"

  changed=$(cat $fileName | jq ${updateName}' |= '"$updateVal")
  echo "${changed}" > $fileName
}


generateRipGrepYaml() {
  #fetch post-install script for vscode ripgrep extension, that references required ripgrep prebuilt binary
  VSCODE_RIPGREP_VERSION=$(cat ${TARGETDIR}/code/package.json | jq -r '.dependencies."@vscode/ripgrep"')
  POST_INSTALL_SCRIPT=$(curl -sSL https://raw.githubusercontent.com/microsoft/vscode-ripgrep/v${VSCODE_RIPGREP_VERSION}/lib/postinstall.js)
  VSIX_RIPGREP_PREBUILT_VERSION=$(echo "${POST_INSTALL_SCRIPT}" | grep "const VERSION" | cut -d"'" -f 2)
  #fetch manifest
  curl -sSL https://download.devel.redhat.com/rcm-guest/staging/devspaces/build-requirements/common/manifest.json -o /tmp/manifest.json

  for platform in "s390x" "powerpc64le" "x86_64"; do
    # CRW-4938 manually override required ripgrep-prebuilt version for certain platforms
    if [[ $platform == "s390x" ]]; then
      REQUIRED_RG_VERSION="13.0.0-4"
    else
      REQUIRED_RG_VERSION=${VSIX_RIPGREP_PREBUILT_VERSION}
    fi
    AVAILABLE_RG_VERSIONS=$(jq 'keys' manifest.json)
    for rcm_extension in "${AVAILABLE_RG_VERSIONS[@]}"
    do
      if [[ $rcm_extension == "${REQUIRED_RG_VERSION}" ]]; then
        echo "[info] found required ripgrep prebuilt extension"
        BIN_SHA=$(jq ".\"${rcm_extension}\".\"${platform}\".sha manifest.json")
        SOURCE_SHA=$(jq ".\"${rcm_extension}\".\"${platform}\".source_sha manifest.json")
      fi
    done
    if [[ $BIN_SHA == "" ]]; then
      echo "[info] not found required ripgrep prebuilt extension for ${REQUIRED_RG_VERSION}"
      echo "[info] downloading and publishing"
      curl -sSL https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/product/uploadBuildRequirementsToSpmmUtil.sh -o /tmp/uploadBuildRequirementsToSpmmUtil.sh
      chmod +x /tmp/uploadBuildRequirementsToSpmmUtil.sh
      case $platform in
        'powerpc64le') ARCH_SUFFIX='powerpc64le-unknown-linux-gnu';;
        's390x') ARCH_SUFFIX='s390x-unknown-linux-gnu';;
        'x86_64') ARCH_SUFFIX='x86_64-unknown-linux-musl';;
      esac
      ./tmp/uploadBuildRequirementsToSpmmUtil.sh -u https://github.com/microsoft/ripgrep-prebuilt/releases/download -ad ripgrep-multiarch -as ripgrep --arches "${ARCH_SUFFIX}" --debug --publish -v ${REQUIRED_RG_VERSION}

      RIPGREP_LOCATION="$BASE_URL/common/${REQUIRED_RG_VERSION}/ripgrep-${REQUIRED_RG_VERSION}-${ARCH_SUFFIX}.tar.gz"
      RG_SHA=$(sha256sum /tmp/$EXTENSION_NAME.tar.gz)
      RG_SHA=${BIN_SHA:0:64}

      RG_SOURCE_SHA=$(curl -s https://github.com/microsoft/ripgrep-prebuilt/archive/refs/tags/${REQUIRED_VERSION}.tar.gz | sha256sum)
      RG_SOURCE_SHA=${SOURCE_SHA:0:64}
      echo "updating manifest with new SHAs"
      replaceField ".\"${rcm_extension}\".\"${platform}\".sha" "$RG_SHA" manifest.json
      replaceField ".\"${rcm_extension}\".\"${platform}\".source_sha" "$RG_SOURCE_SHA" manifest.json
    fi

    # generate parts of fetch-artifacts for this platform
    echo "#ripgrep-${platform}
  - url: $RIPGREP_LOCATION
    sha256: $PLUGIN_SHA
    source-url: $BASE_URL/devspaces-$DS_VERSION-pluginregistry/sources/$PLUGIN-sources.tar.gz
    source-sha256: $SOURCE_SHA" >> ${TARGETDIR}/fetch-artifacts-url.yaml
  done
  #TODO auth for rsync
  #debug show manifest
  cat /tmp/manifest.json
  rsync -av /tmp/manifest.json ${BASE_URL}/common/manifest.json

  #TODO cleanup
  rm /tmp/manifest.json
  rm /tmp/build-requirements/*
}


### VSIX MANIFESTS ###
generateVsixArtifactsURLYaml () {
  SCRIPTS_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [[ $SCRIPTS_BRANCH != "devspaces-3."*"-rhel-8" ]]; then SCRIPTS_BRANCH="devspaces-3-rhel-8"; fi
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
    AVAILABLE_VSIX_VERSION=$(cat /tmp/plugin-config.json | jq -r ".Plugins.[\"$PLUGIN\"][\"version\"]")
    REQUIRED_VSIX_VERSION=$(cat $TARGETDIR/code/product.json | jq -r ".builtInExtensions[\"$PLUGIN\"][\"version\"]")
    if [[ $REQUIRED_VSIX_VERSION == $AVAILABLE_VSIX_VERSION ]]; then
      echo "[info] found required vsix extension - ${PLUGIN}, version ${REQUIRED_VSIX_VERSION}"
      PLUGIN_SHA=$(cat /tmp/plugin-manifest.json | jq -r ".Plugins[\"$PLUGIN\"][\"vsix\"]")
      SOURCE_SHA=$(cat /tmp/plugin-manifest.json | jq -r ".Plugins[\"$PLUGIN\"][\"source\"]")
    else
      echo "[info] not found required ripgrep prebuilt extension for ${REQUIRED_RG_VERSION}"
      echo "[info] downloading and publishing"
      if [[ -f /tmp/redhat-vscode-extensions ]]; then
        git clone git@github.com:redhat-developer/devspaces-vscode-extensions
      fi
      pushd > /tmp/redhat-vscode-extensions >/dev/null
        ./build/build.sh $PLUGIN
        ./copyVSIXToStage.sh -b ${MIDSTM_BRANCH} -v ${DS_VERSION}
        #update plugin-manifest
        git add plugin-manifest.json
        git commit -sm "[update plugin-manifest"
      popd >/dev/null

      # TODO upload new version
    fi
    echo "#$PLUGIN
- url: $BASE_URL/devspaces-$DS_VERSION-pluginregistry/plugins/$PLUGIN.vsix
  sha256: $PLUGIN_SHA
  source-url: $BASE_URL/devspaces-$DS_VERSION-pluginregistry/sources/$PLUGIN-sources.tar.gz
  source-sha256: $SOURCE_SHA" >> ${TARGETDIR}/fetch-artifacts-url.yaml
  done
  rm /tmp/plugin-manifest.json
}

### MAIN ###

generateFetchArtifactsURLYaml() {
  generateRipGrepYaml
  generateVsixArtifactsURLYaml
}
