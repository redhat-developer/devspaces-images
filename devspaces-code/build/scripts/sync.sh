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

BASE_URL="https://download.devel.redhat.com/rcm-guest/staging/devspaces/build-requirements"

generateFetchArtifactsURLYaml () {
  SCRIPTS_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [[ $SCRIPTS_BRANCH != "devspaces-3."*"-rhel-8" ]]; then SCRIPTS_BRANCH="devspaces-3-rhel-8"; fi
  curl -sSL https://raw.githubusercontent.com/redhat-developer/devspaces-vscode-extensions/${SCRIPTS_BRANCH}/plugin-manifest.json --output /tmp/plugin-manifest.json

  PLUGINS=$(cat /tmp/plugin-manifest.json | jq -r '.Plugins | keys[]')

  for PLUGIN in $PLUGINS; do

    #filter out non built-in plugins
    if [[ $PLUGIN != "ms-vscode"* ]]; then
      continue
    fi

    PLUGIN_SHA=$(cat /tmp/plugin-manifest.json | jq -r ".Plugins[\"$PLUGIN\"][\"vsix\"]")
    SOURCE_SHA=$(cat /tmp/plugin-manifest.json | jq -r ".Plugins[\"$PLUGIN\"][\"source\"]")

    echo "#$PLUGIN
- url: $BASE_URL/devspaces-$DS_VERSION-pluginregistry/plugins/$PLUGIN.vsix
  sha256: $PLUGIN_SHA
  source-url: $BASE_URL/devspaces-$DS_VERSION-pluginregistry/sources/$PLUGIN-sources.tar.gz
  source-sha256: $SOURCE_SHA" >> ${TARGETDIR}/fetch-artifacts-url.yaml
  
  done
  rm /tmp/plugin-manifest.json
}

# defaults
CSV_VERSION=3.y.0 # csv 3.y.0
DS_VERSION=${CSV_VERSION%.*} # tag 3.y

UPSTM_NAME="che-code"
MIDSTM_NAME="code"

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] [-s /path/to/${UPSTM_NAME}] [-t /path/to/generated]
Example: $0 -v 3.y.0 -s ${HOME}/projects/${UPSTM_NAME} -t /tmp/devspaces-${MIDSTM_NAME}"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; DS_VERSION="${CSV_VERSION%.*}"; shift 1;;
    # paths to use for input and output
    '-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    '--help'|'-h') usage;;
  esac
  shift 1
done

if [[ ! -d "${SOURCEDIR}" ]]; then usage; fi
if [[ ! -d "${TARGETDIR}" ]]; then usage; fi
if [[ "${CSV_VERSION}" == "3.y.0" ]]; then usage; fi

# workaround for CRW-4328 and broken rhpkg release -- add a .spec file (that will be ignored)
# ignore changes in these files
echo ".che/
.rebase/
.git/
.github/
.gitignore
README.md
Dockerfile
branding/css
branding/icons
branding/product.json
branding/workbench-config.json
build/scripts/sync.sh
build/scripts/collect-assets.sh
build/dockerfiles
cachito
code/src/vs/code/electron-main
code/src/vs/platform/environment/test/node/nativeModules.test.ts
code/src/vs/platform/keyboardLayout/electron-main/keyboardLayoutMainService.ts
/container.yaml
/content_sets.*
/cvp.yml
/cvp-owners.yml
devfile.yaml
fetch-artifacts-url.yaml
get-sources.sh
rebase.sh
sources
sources.spec
/tests/basic-test.yaml
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete "${SOURCEDIR}"/ "${TARGETDIR}"/
rm -f /tmp/rsync-excludes

# ensure shell scripts are executable
find "${TARGETDIR}"/ -name "*.sh" -exec chmod +x {} \;

sed_in_place() {
    SHORT_UNAME=$(uname -s)
  if [ "$(uname)" == "Darwin" ]; then
    sed -i '' "$@"
  elif [ "${SHORT_UNAME:0:5}" == "Linux" ]; then
    sed -i "$@"
  fi
}

sed_in_place -r \
  `# Update DevSpaces version for Dockerfile` \
  -e "s/version=.*/version=\"$DS_VERSION\" \\\/" \
  "${TARGETDIR}"/build/dockerfiles/brew.Dockerfile

  (cd "$TARGETDIR/branding" && ./branding.sh)

pushd "${TARGETDIR}"/ >/dev/null
  # --- BEGIN update container.yaml and brew.Dockerfile - generate list of packages
  CONTAINER_YAML_MODULE_LIST=
  DOCKERFILE_YAML_BUILD_COMMAND=

  # collect list of modules from 'code/build/npm/dirs.js' (except the 'test' folder) 
  readarray -t YARN_MODULES  < <(cat code/build/npm/dirs.js | sed -n "/const dirs/,/]/{/'/p};" | sed "s/,//g;s/\s'/devspaces-code\/code\//g;s/'//g;/devspaces-code\/code\/test/d")

  # prepare generated content 
  for yarn_module in "${YARN_MODULES[@]}"; do
    DOCKERFILE_YAML_BUILD_COMMAND+="\n    && cd \$REMOTE_SOURCES_DIR/devspaces-images-code/app/${yarn_module} && yarn \\\\"
    CONTAINER_YAML_MODULE_LIST+="\n        - path: $yarn_module"
  done
  # remove leading new line from container yaml module list
  CONTAINER_YAML_MODULE_LIST=${CONTAINER_YAML_MODULE_LIST:2}

  CONTAINER_YAML_MODULE_LIST+="\n        - path: devspaces-code/launcher

  # remove trailing \
  DOCKERFILE_YAML_BUILD_COMMAND=${DOCKERFILE_YAML_BUILD_COMMAND%\\\\}
  # remove leading '\n    && '
  DOCKERFILE_YAML_BUILD_COMMAND=${DOCKERFILE_YAML_BUILD_COMMAND:9}
  DOCKERFILE_YAML_BUILD_COMMAND="RUN ${DOCKERFILE_YAML_BUILD_COMMAND}"

  # echo into the file to preserve formatting
  echo -e "$DOCKERFILE_YAML_BUILD_COMMAND" >> /tmp/dockerfile_command 
  # use comments in the beginning/end of the command, to delete the content between them and refresh it with new list of modules
  sed_in_place '/begin of module list generated by sync.sh/,/end of module list generated by sync.sh/{//!d;}' ${TARGETDIR}/build/dockerfiles/brew.Dockerfile
  sed_in_place '/begin of module list generated by sync.sh/ r /tmp/dockerfile_command' ${TARGETDIR}/build/dockerfiles/brew.Dockerfile
  rm /tmp/dockerfile_command

  # TODO consider more precise replacement for container.yaml
  # in case it's not gonna be in the end of the file anymore
  # e.g. with yq added in for loop
  # yq -y --in-place  '.remote_sources[0].remote_source.packages.yarn += { "path": "'$yarn_module'" }'
  # but yq removes comments and formatting
  sed_in_place '0,/this section is automatically generated in sync.sh/!d' ${TARGETDIR}/container.yaml
  echo -e "$CONTAINER_YAML_MODULE_LIST" >> ${TARGETDIR}/container.yaml
  # --- END update container.yaml and brew.Dockerfile

  # --- BEGIN fetch-artifacts-url.yaml - generate list checksums
  # fetch artifacts yaml consists of two parts - ripgrep libraries (that are uploaded to rcm-tools manually),
  # and vscode builtin plugins, that are build and pushed (that are uploaded automatically with pluginregistry_plugins jenkins job).
  # Here we remove and regenerate only the built-in plugins (keep the ripgrep-related content)
  sed_in_place '0,/# List of VS Code built-ins that are published through Jenkins job at rcm-tools/!d' ${TARGETDIR}/fetch-artifacts-url.yaml
  generateFetchArtifactsURLYaml
  # --- END fetch-artifacts-url.yaml
popd >/dev/null
