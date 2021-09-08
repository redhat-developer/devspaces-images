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
# convert upstream che repo to midstream crw-images repo using yq, sed

set -e

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y

UPSTM_NAME="operator"
MIDSTM_NAME="operator-metadata"

CSV_VERSION_PREV="2.10.1"

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] [-s /path/to/${UPSTM_NAME}] [-t /path/to/generated] -p [CRW CSV_VERSION_PREV]
Example: $0 -v 2.y.0 -s ${HOME}/projects/${UPSTM_NAME} -t /tmp/crw-${MIDSTM_NAME} -p 2.y-1.0"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; CRW_VERSION="${CSV_VERSION%.*}"; shift 1;;
    # paths to use for input and output
    '-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    '-p') CSV_VERSION_PREV="$2"; shift 1;;
    '--help'|'-h') usage;;
  esac
  shift 1
done

if [[ ! -d "${SOURCEDIR}" ]]; then usage; fi
if [[ ! -d "${TARGETDIR}" ]]; then usage; fi
if [[ "${CSV_VERSION}" == "2.y.0" ]]; then usage; fi

# if not set via commandline, compute CSV_VERSION_PREV
# from https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/crw-2-rhel-8/dependencies/VERSION.json
# shellcheck disable=SC2086
if [[ -z "${CSV_VERSION_PREV}" ]]; then
    MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "crw-2-rhel-8")
    if [[ ${MIDSTM_BRANCH} != "crw-"*"-rhel-"* ]]; then MIDSTM_BRANCH="crw-2-rhel-8"; fi
    versionjson="$(curl -sSLo- "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/dependencies/VERSION.json")"
    if [[ $versionjson == *"404"* ]] || [[ $versionjson == *"Not Found"* ]]; then 
        echo "[ERROR] Could not load https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/dependencies/VERSION.json"
        echo "[ERROR] Please use -p flag to set CSV_VERSION_PREV"
        exit 1
    fi
    if [[ $MIDSTM_BRANCH == "crw-2-rhel-8" ]]; then
        CRW_VERSION="$(echo "$versionjson" | jq -r '.Version')"
    else 
        CRW_VERSION=${MIDSTM_BRANCH/crw-/}; CRW_VERSION=${CRW_VERSION//-rhel-8}
    fi
    if [[ -z "${CSV_VERSION_PREV}" ]]; then
        CSV_VERSION_PREV="$(echo "$versionjson" | jq -r '.CSVs["operator-metadata"]."'${CRW_VERSION}'".CSV_VERSION_PREV')"
        if [[ ${CSV_VERSION_PREV} == "null" ]]; then CSV_VERSION_PREV="main"; fi
    fi
fi
echo "[INFO] For ${CRW_VERSION} / ${MIDSTM_BRANCH}:"
echo "[INFO]   CSV_VERSION_PREV   = ${CSV_VERSION_PREV}"

# ignore changes in these files
echo ".ci/
.dockerignore
.git/
.github/
.gitignore
.vscode/
/container.yaml
/content_sets.*
/cvp.yml
api/
build/
config/
controllers/
cvp-owners.yml
Dependencies.md
devfile.yaml
devfiles.yaml
Dockerfile
get-source*.sh
go.mod
go.sum
hack/
main.go
make-release.sh
Makefile
manifests
metadata
mocks/
olm/
pkg/
PROJECT
README.md
RELEASE.md
REQUIREMENTS
sources
templates/
tests/basic-test.yaml
tools.go
vendor/
version/
" > /tmp/rsync-excludes
# echo "manifests
# metadata
# bundle
# " > /tmp/rsync-includes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes  --delete "${SOURCEDIR}"/ "${TARGETDIR}"/ # --include-from /tmp/rsync-includes
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

# create dockerfile
cat << EOT > "${TARGETDIR}"/Dockerfile
# Copyright (c) 2020-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# metadata images built in brew must be from scratch
# https://docs.engineering.redhat.com/display/CFC/Migration
FROM scratch

COPY manifests /manifests/
COPY metadata /metadata/

# append Brew metadata here 
ENV SUMMARY="Red Hat CodeReady Workspaces ${MIDSTM_NAME} container" \\
    DESCRIPTION="Red Hat CodeReady Workspaces ${MIDSTM_NAME} container" \\
    PRODNAME="codeready-workspaces" \\
    COMPNAME="${MIDSTM_NAME}"
LABEL operators.operatorframework.io.bundle.mediatype.v1=registry+v1 \\
      operators.operatorframework.io.bundle.manifests.v1=manifests/ \\
      operators.operatorframework.io.bundle.metadata.v1=metadata/ \\
      operators.operatorframework.io.bundle.package.v1=codeready-workspaces \\
      operators.operatorframework.io.bundle.channels.v1=latest \\
      operators.operatorframework.io.bundle.channel.default.v1=latest \\
      com.redhat.delivery.operator.bundle="true" \\
      com.redhat.openshift.versions="v4.6" \\
      com.redhat.delivery.backport=false \\
      summary="\$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-rhel8-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${CRW_VERSION}" \\
      license="EPLv2" \\
      maintainer="Anatolii Bazko <abazko@redhat.com>, Nick Boldt <nboldt@redhat.com>, Dmytro Nochevnov <dnochevn@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Generated Dockerfile"

"${TARGETDIR}"/build/scripts/sync-che-operator-to-crw-operator.sh -v "${CSV_VERSION}" -s "${SOURCEDIR}/" -t "${TARGETDIR}/"
"${TARGETDIR}"/build/scripts/sync-che-olm-to-crw-olm.sh -v "${CSV_VERSION}" -p "${CSV_VERSION_PREV}" -s "${SOURCEDIR}/" -t "${TARGETDIR}/"

pushd "${TARGETDIR}"/ >/dev/null || exit
rm -fr 	api/ bundle/ config/ controllers/ hack/ mocks/ olm/ pkg/ templates/ vendor/ version/ go.* *.go

# transform into Brew-friendly version of CSV
sed -r -i "${TARGETDIR}"/manifests/codeready-workspaces.csv.yaml \
  -e "s@registry.redhat.io/codeready-workspaces/@registry-proxy.engineering.redhat.com/rh-osbs/codeready-workspaces-@g" \
  -e "s@crw-2-rhel8-operator@operator@g"
