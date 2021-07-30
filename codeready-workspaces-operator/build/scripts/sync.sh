#!/bin/bash
#
# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# convert registry upper-midstream (crw repo, forked from upstream w/ different plugins) to lower-midstream (crw-images repo) using yq, sed

set -e

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y

UPSTM_NAME="operator"
MIDSTM_NAME="operator"

DEV_WORKSPACE_CONTROLLER_VERSION="" # main or 0.y.x
DEV_WORKSPACE_CHE_OPERATOR_VERSION="" # main or 7.yy.x 

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] [-s /path/to/${UPSTM_NAME}] [-t /path/to/generated] [--dwob branch] [--dwcob branch]
Example: $0 -v 2.y.0 -s ${HOME}/projects/${UPSTM_NAME} -t /tmp/crw-${MIDSTM_NAME} --dwob 0.y.x --dwcob 7.yy.x"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; CRW_VERSION="${CSV_VERSION%.*}"; shift 1;;
    # paths to use for input and output
    '-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    '--dwob'|'--dwcv') DEV_WORKSPACE_CONTROLLER_VERSION="$2"; shift 1;;
    '--dwcob'|'--dwcov') DEV_WORKSPACE_CHE_OPERATOR_VERSION="$2"; shift 1;;
    '--help'|'-h') usage;;
  esac
  shift 1
done

if [[ ! -d "${SOURCEDIR}" ]]; then usage; fi
if [[ ! -d "${TARGETDIR}" ]]; then usage; fi
if [[ "${CSV_VERSION}" == "2.y.0" ]]; then usage; fi

# if not set via commandline, compute DEV_WORKSPACE_CONTROLLER_VERSION and DEV_WORKSPACE_CHE_OPERATOR_VERSION
# from https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/VERSION.json
# shellcheck disable=SC2086
if [[ -z "${DEV_WORKSPACE_CONTROLLER_VERSION}" ]] || [[ -z "${DEV_WORKSPACE_CHE_OPERATOR_VERSION}" ]]; then
    MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "crw-2-rhel-8")
    if [[ ${MIDSTM_BRANCH} != "crw-"*"-rhel-"* ]]; then MIDSTM_BRANCH="crw-2-rhel-8"; fi
    versionjson="$(curl -sSLo- "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/dependencies/VERSION.json")"
    if [[ $versionjson == *"404"* ]] || [[ $versionjson == *"Not Found"* ]]; then 
        echo "[ERROR] Could not load https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/dependencies/VERSION.json"
        echo "[ERROR] Please use --dwob and --dwcob flags to set DEV_WORKSPACE_CONTROLLER_VERSION and DEV_WORKSPACE_CHE_OPERATOR_VERSION parameters"
        exit 1
    fi
    if [[ -z "${DEV_WORKSPACE_CONTROLLER_VERSION}" ]]; then
        DEV_WORKSPACE_CONTROLLER_VERSION="$(echo "$versionjson" | jq -r '.Jobs["devworkspace-controller"]."'${CRW_VERSION}'"')"
        if [[ ${DEV_WORKSPACE_CONTROLLER_VERSION} == "null" ]]; then DEV_WORKSPACE_CONTROLLER_VERSION="main"; fi
    fi
    if [[ -z "${DEV_WORKSPACE_CHE_OPERATOR_VERSION}" ]]; then
        DEV_WORKSPACE_CHE_OPERATOR_VERSION="$(echo "$versionjson" | jq -r '.Jobs["devworkspace"]."'${CRW_VERSION}'"')"
        if [[ ${DEV_WORKSPACE_CHE_OPERATOR_VERSION} == "null" ]]; then DEV_WORKSPACE_CHE_OPERATOR_VERSION="main"; fi
    fi
fi
# echo "[INFO] For ${CRW_VERSION} / ${MIDSTM_BRANCH}:"
# echo "[INFO]   DEV_WORKSPACE_CONTROLLER_VERSION   = ${DEV_WORKSPACE_CONTROLLER_VERSION}"
# echo "[INFO]   DEV_WORKSPACE_CHE_OPERATOR_VERSION = ${DEV_WORKSPACE_CHE_OPERATOR_VERSION}"
# exit 

# ignore changes in these files
echo ".github/
.git/
.gitignore
.dockerignore
build/
devfiles.yaml
/container.yaml
/content_sets.*
/cvp.yml
PROJECT
README.md
RELEASE.md
REQUIREMENTS
get-source*.sh
tests/basic-test.yaml
sources
make-release.sh
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

# shellcheck disable=SC2086
sed_in_place -r \
  `# Replace ubi8 with rhel8 version` \
  -e "s#ubi8/go-toolset#rhel8/go-toolset#g" \
  `# Remove registry so build works in Brew` \
  -e "s#FROM (registry.access.redhat.com|registry.redhat.io)/#FROM #g" \
  -e "s/# *RUN yum /RUN yum /g" \
  `# CRW-1674 DEV_WORKSPACE_*_VERSION transformation step also done in get-sources.sh` \
  -e 's#^ARG DEV_WORKSPACE_CONTROLLER_VERSION="([^"]+)"#ARG DEV_WORKSPACE_CONTROLLER_VERSION="'${DEV_WORKSPACE_CONTROLLER_VERSION}'"#' \
  -e 's#^ARG DEV_WORKSPACE_CHE_OPERATOR_VERSION="([^"]+)"#ARG DEV_WORKSPACE_CHE_OPERATOR_VERSION="'${DEV_WORKSPACE_CHE_OPERATOR_VERSION}'"#' \
  `# CRW-1655, CRW-1956 use local zips instead of fetching from the internet` \
  -e "s#^RUN curl .+/tmp/asset.+.zip.+#COPY asset-*.zip /tmp#g" \
  -e "s#^ +curl .+/tmp/asset.+.zip.+##g" \
  "${TARGETDIR}"/Dockerfile

cat << EOT >> "${TARGETDIR}"/Dockerfile

ENV SUMMARY="Red Hat CodeReady Workspaces ${MIDSTM_NAME} container" \\
    DESCRIPTION="Red Hat CodeReady Workspaces ${MIDSTM_NAME} container" \\
    PRODNAME="codeready-workspaces" \\
    COMPNAME="${MIDSTM_NAME}"

LABEL com.redhat.delivery.appregistry="false" \\
      summary="\$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-rhel8-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${CRW_VERSION}" \\
      license="EPLv2" \\
      maintainer="Nick Boldt <nboldt@redhat.com>, Dmytro Nochevnov <dnochevn@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"

# shellcheck disable=SC2086
sed_in_place -r \
  -e 's#^DEV_WORKSPACE_CONTROLLER_VERSION="([^"]+)"#DEV_WORKSPACE_CONTROLLER_VERSION="'${DEV_WORKSPACE_CONTROLLER_VERSION}'"#' \
  -e 's#^DEV_WORKSPACE_CHE_OPERATOR_VERSION="([^"]+)"#DEV_WORKSPACE_CHE_OPERATOR_VERSION="'${DEV_WORKSPACE_CHE_OPERATOR_VERSION}'"#' \
  "${TARGETDIR}"/get-sources.sh
echo "Updated get-sources.sh"

"${TARGETDIR}"/build/scripts/sync-che-operator-to-crw-operator.sh -v "${CSV_VERSION}" -s "${SOURCEDIR}/" -t "${TARGETDIR}/"
