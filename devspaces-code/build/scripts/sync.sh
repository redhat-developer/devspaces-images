#!/bin/bash
#
# Copyright (c) 2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

set -e

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
DS_VERSION=${CSV_VERSION%.*} # tag 2.y

UPSTM_NAME="che-code"
MIDSTM_NAME="code"

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] [-s /path/to/${UPSTM_NAME}] [-t /path/to/generated]
Example: $0 -v 2.y.0 -s ${HOME}/projects/${UPSTM_NAME} -t /tmp/devspaces-${MIDSTM_NAME}"
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
if [[ "${CSV_VERSION}" == "2.y.0" ]]; then usage; fi

# ignore changes in these files
echo ".che/
.rebase/
.git/
.github/
README.md
Dockerfile
build/scripts/sync.sh
build/scripts/collect-assets.sh
build/dockerfiles
code/src/vs/code/electron-main
code/src/vs/platform/environment/test/node/nativeModules.test.ts
code/src/vs/platform/keyboardLayout/electron-main/keyboardLayoutMainService.ts
/container.yaml
/content_sets.*
/cvp.yml
/cvp-owners.yml
devfile.yaml
get-sources.sh
rebase.sh
sources
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

sed_in_place -r \ '/"native-keymap":*/d' "${TARGETDIR}"/code/package.json

sed_in_place -r \
  `# Update DevSpaces version for Dockerfile` \
  -e "s/version=.*/version=\"$DS_VERSION\" \\\/" \
  "${TARGETDIR}"/Dockerfile
