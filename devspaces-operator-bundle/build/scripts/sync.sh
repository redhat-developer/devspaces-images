#!/bin/bash
#
# Copyright (c) 2021-22 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# convert upstream che repo to midstream devspaces-images repo using yq, sed

set -e

# defaults
CSV_VERSION=3.y.0 # csv 3.y.0
DS_VERSION=${CSV_VERSION%.*} # tag 3.y

UPSTM_NAME="operator"
MIDSTM_NAME="operator-bundle"

CSV_VERSION_PREV=""

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] [-s /path/to/${UPSTM_NAME}] [-t /path/to/generated] [-p DS CSV_VERSION_PREV]
Example: $0 -v 3.y.0 -s ${HOME}/projects/${UPSTM_NAME} -t /tmp/ds-${MIDSTM_NAME} -p 3.y-1.0"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; DS_VERSION="${CSV_VERSION%.*}"; shift 1;;
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
if [[ "${CSV_VERSION}" == "3.y.0" ]]; then usage; fi

# if not set via commandline, compute CSV_VERSION_PREV
# from https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json
# shellcheck disable=SC2086
if [[ -z "${CSV_VERSION_PREV}" ]]; then
    
    MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "devspaces-3-rhel-8")
    if [[ ${MIDSTM_BRANCH} != "devspaces-"*"-rhel-"* ]]; then MIDSTM_BRANCH="devspaces-3-rhel-8"; fi
    # load the latest job-config.json, not the branched version; this ensures we get CVE updates (CRW-4324)
    configjson="$(curl -sSLo- "https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json")"
    if [[ $configjson == *"404"* ]] || [[ $configjson == *"Not Found"* ]]; then 
        echo "[ERROR] Could not load https://raw.githubusercontent.com/redhat-developer/devspaces/devspaces-3-rhel-8/dependencies/job-config.json"
        echo "[ERROR] Please use -p flag to set CSV_VERSION_PREV"
        exit 1
    fi
    if [[ $MIDSTM_BRANCH == "devspaces-3-rhel-8" ]]; then
        DS_VERSION="$(echo "$configjson" | jq -r '.Version')"
    else 
        DS_VERSION=${MIDSTM_BRANCH/devspaces-/}; DS_VERSION=${DS_VERSION//-rhel-8}
    fi
    
    if [[ -z "${CSV_VERSION_PREV}" ]]; then
        #get from json
        CSV_VERSION_PREV="$(echo "$configjson" | jq -r '.CSVs["'${MIDSTM_NAME}'"]."'${DS_VERSION}'".CSV_VERSION_PREV')"
        DS_VERSION_PREV="${CSV_VERSION_PREV%-*}"; DS_VERSION_PREV="${DS_VERSION_PREV%.*}"
        echo "[INFO] config.json#.CSVs[${MIDSTM_NAME}][$DS_VERSION][CSV_VERSION_PREV] = ${CSV_VERSION_PREV}  (DS_VERSION_PREV = ${DS_VERSION_PREV})"
        
        # check if image exists for that tag (doesn't work with CVE respins, only manual releases)
        # CRW-2725 also check quay, so we can check update path from 3.y.0.RC -> 3.y+1.0.CI (need to resolve against pre-GA content, not just RHEC GA)
        if [[ ! $(skopeo inspect docker://registry.redhat.io/devspaces/devspaces-${MIDSTM_NAME}:${DS_VERSION_PREV} --raw 2>/dev/null) ]] && \
           [[ ! $(skopeo inspect docker://quay.io/devspaces/devspaces-${MIDSTM_NAME}:${DS_VERSION_PREV} --raw 2>/dev/null) ]]; then
            # else get from latest released image
            curl -sSL https://raw.githubusercontent.com/redhat-developer/devspaces/${MIDSTM_BRANCH}/product/containerExtract.sh --output /tmp/containerExtract.sh
            if [[ $(cat /tmp/containerExtract.sh) == *"404"* ]] || [[ $(cat /tmp/containerExtract.sh) == *"Not Found"* ]]; then
                echo "[ERROR] Could not load https://raw.githubusercontent.com/redhat-developer/devspaces/${MIDSTM_BRANCH}/product/containerExtract.sh"
                exit 1
            fi
            chmod +x /tmp/containerExtract.sh
            # NOTE: for CVE respins, container tag != CSV version, so we have to extract the container to get the CSV version, then replace + with -
            rm -fr /tmp/registry.redhat.io-devspaces-devspaces-${MIDSTM_NAME}-latest-*
            /tmp/containerExtract.sh --delete-before --delete-after registry.redhat.io/devspaces/devspaces-${MIDSTM_NAME}:latest
            CSV_VERSION_PREV="$(yq -r '.spec.version' /tmp/registry.redhat.io-devspaces-devspaces-${MIDSTM_NAME}-latest-*/manifests/devspaces.csv.yaml | tr "+" "-")"
            echo "[INFO] registry.redhat.io/devspaces/devspaces-${MIDSTM_NAME}:latest#.spec.version = ${CSV_VERSION_PREV}"
            rm -fr /tmp/registry.redhat.io-devspaces-devspaces-${MIDSTM_NAME}-latest-*
            rm -fr /tmp/containerExtract.sh
            if [[ ${CSV_VERSION_PREV} == "null" ]]; then CSV_VERSION_PREV="main"; fi
        fi
    fi
fi
if [[ -n ${MIDSTM_BRANCH} ]]; then 
  echo "[INFO] For DS VERSION = ${DS_VERSION} / MIDSTM_BRANCH = ${MIDSTM_BRANCH}:"
else
  echo "[INFO] For DS VERSION = ${DS_VERSION}:"
fi
echo "[INFO]     CSV_VERSION_PREV = ${CSV_VERSION_PREV}"

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
/cvp-owners.yml
api/
build/
config/
controllers/
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
pkg/
PROJECT
README.md
RELEASE.md
REQUIREMENTS
sources
helmcharts/
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
ENV SUMMARY="Red Hat OpenShift Dev Spaces ${MIDSTM_NAME} container" \\
    DESCRIPTION="Red Hat OpenShift Dev Spaces ${MIDSTM_NAME} container" \\
    PRODNAME="devspaces" \\
    COMPNAME="${MIDSTM_NAME}"
LABEL operators.operatorframework.io.bundle.mediatype.v1=registry+v1 \\
      operators.operatorframework.io.bundle.manifests.v1=manifests/ \\
      operators.operatorframework.io.bundle.metadata.v1=metadata/ \\
      operators.operatorframework.io.bundle.package.v1=devspaces \\
      operators.operatorframework.io.bundle.channels.v1=stable \\
      operators.operatorframework.io.bundle.channel.default.v1=stable \\
      com.redhat.delivery.operator.bundle="true" \\
      com.redhat.openshift.versions="v4.10" \\
      com.redhat.delivery.backport=false \\
      summary="\$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${DS_VERSION}" \\
      license="EPLv2" \\
      maintainer="Anatolii Bazko <abazko@redhat.com>, Nick Boldt <nboldt@redhat.com>, Dmytro Nochevnov <dnochevn@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Generated Dockerfile"

"${TARGETDIR}"/build/scripts/sync-che-operator.sh -v "${CSV_VERSION}" -s "${SOURCEDIR}/" -t "${TARGETDIR}/"
"${TARGETDIR}"/build/scripts/sync-che-olm.sh -v "${CSV_VERSION}" -p "${CSV_VERSION_PREV}" -s "${SOURCEDIR}/" -t "${TARGETDIR}/"

pushd "${TARGETDIR}"/ >/dev/null || exit
rm -fr 	api/ bundle/ config/ controllers/ hack/ mocks/ pkg/ vendor/ version/ go.* *.go

CSVFILE="${TARGETDIR}"/manifests/devspaces.csv.yaml
# transform into Brew-friendly version of CSV
# OPTION 1: only for images changed in this respin (required for subsequent GAs of 3.y.z)
# sed -r -i "${CSVFILE}" \
  # -e "s@registry.redhat.io/devspaces/devspaces-rhel8-operator@registry-proxy.engineering.redhat.com/rh-osbs/devspaces-operator@g"
  # ...
# OPTION 2: use images from reg-proxy, which could be older than the RHEC Freshmaker updates (required for initial GA of 3.y.0)
# CRW-4077 : DO NOT change image references if they have a @sha256: reference, only :3.y
sed -i "${CSVFILE}" -r \
  -e "s%(registry.redhat.io|quay.io)/devspaces/(.+:${DS_VERSION})%registry-proxy.engineering.redhat.com/rh-osbs/devspaces-\2%g" \
  -e "s@devspaces-rhel8-operator@operator@g" \
  -e "s@:latest@:${DS_VERSION}@g"

# date in CSV will be updated only if there were any changes in CSV
pushd ${CSVFILE%/*} >/dev/null || exit # targetdir/manifests/
# git diff ${CSVFILE##*/}
if [[ ! $(git diff ${CSVFILE##*/} | grep -v createdAt | egrep "^(-|\\+) " || true) ]]; then
  git checkout ${CSVFILE##*/} || true
fi
popd >/dev/null || exit
