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
# SPECIAL CASE: convert registry upper-midstream (crw repo, forked from upstream w/ different plugins) to lower-midstream (crw-images repo) using yq, sed
# https://github.com/redhat-developer/codeready-workspaces/tree/crw-2-rhel-8/dependencies to https://github.com/redhat-developer/codeready-workspaces-images

set -e

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y

UPSTM_NAME="che-plugin-registry"
MIDSTM_NAME="pluginregistry"

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] [-s /path/to/sources] [-t /path/to/generated] [-b CRW_BRANCH]
Example: $0 -v 2.y.0 -s ${HOME}/codeready-workspaces -t /tmp/codeready-workspaces-images/codeready-workspaces-${MIDSTM_NAME} -b crw-2.y-rhel-8
"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-b') CRW_BRANCH="$2"; shift 1;;
    # for CSV_VERSION = 2.2.0, get CRW_VERSION = 2.2
    '-v') CSV_VERSION="$2"; CRW_VERSION="${CSV_VERSION%.*}"; shift 1;;
    # paths to use for input and ouput
    '-s') SOURCEDIR="$2"; SOURCEDIR=${SOURCEDIR%/}/dependencies/${UPSTM_NAME};
        if [[ ! -d ${SOURCEDIR} ]]; then echo "Cannot find ${SOURCEDIR} !"; exit 1; fi;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    '--help'|'-h') usage;;
    # optional tag overrides
  esac
  shift 1
done

if [ "${CSV_VERSION}" == "2.y.0" ]; then usage; fi

# try to compute branches from currently checked out branch; else fall back to hard coded value for where to find 
# https://github.com/redhat-developer/codeready-workspaces-images/blob/${CRW_BRANCH}/codeready-workspaces-operator-metadata-generated/manifests/codeready-workspaces.csv.yaml
if [[ -z ${CRW_BRANCH} ]]; then 
  CRW_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [[ $CRW_BRANCH != "crw-2."*"-rhel-8" ]]; then
    CRW_BRANCH="crw-2-rhel-8"
  fi
fi

# step one - build the builder image
BUILDER=$(command -v podman || true)
if [[ ! -x $BUILDER ]]; then
  echo "[WARNING] podman is not installed, trying with docker"
  BUILDER=$(command -v docker || true)
  if [[ ! -x $BUILDER ]]; then
      echo "[ERROR] must install docker or podman. Abort!"; exit 1
  fi
fi

# global / generic changes
echo ".github/
.git/
.gitattributes
/build/scripts/sync.sh
/bootstrap.Dockerfile
/cvp.yml
/container.yaml
/content_sets.*
/cvp.yml
/cvp-owners.yml
/sources
/get-source*.sh
/tests/basic-test.yaml
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete "${SOURCEDIR}"/ "${TARGETDIR}"/
rm -f /tmp/rsync-excludes

# special case, copy job-config.json into midstream root dir so it's accessible from /build/../job-config.json
rsync -azrlt --checksum "${SOURCEDIR%/*}/job-config.json" "${TARGETDIR}"/

# ensure shell scripts are executable
find "${TARGETDIR}"/ -name "*.sh" -exec chmod +x {} \;

# CRW-1792 transform che-editors.yaml#L5 and che-plugins.yaml#L3 to refer to /latest
pushd "${TARGETDIR}" >/dev/null || exit 1
for d in che-editors.yaml che-plugins.yaml; do 
    sed -i ${d} -r -e "s|/nightly|/latest|" -e "s|/next|/latest|"
done
popd >/dev/null || exit

# transform Dockerfile
# shellcheck disable=SC1004
sed "${TARGETDIR}/build/dockerfiles/Dockerfile" --regexp-extended \
    `# Strip registry from image references` \
    -e 's|FROM registry.access.redhat.com/|FROM |' \
    -e 's|FROM registry.redhat.io/|FROM |' \
    `# CRW-2448 switch from ubi8 to rhel8 for OSBS` \
    -e 's|ubi8/httpd-24:([0-9]+)(-[0-9.]+)|rhel8/httpd-24:\1|g' \
    -e 's|ubi8/httpd-24$|rhel8/httpd-24|g' \
    `# trim off version so we get the latest from internal registry` \
    -e 's|ubi8/python-38:([0-9]+)(-[0-9.]+)|ubi8/python-38:\1|g' \
    `# Set arg options: disable BOOTSTRAP; update CRW_BRANCH to correct value` \
    -e 's|ARG BOOTSTRAP=.*|ARG BOOTSTRAP=false|' \
    -e "s|ARG CRW_BRANCH=.*|ARG CRW_BRANCH=${CRW_BRANCH}|" \
    `# Enable offline build - copy in built binaries` \
    -e 's|# (COPY root-local.tgz)|\1|' \
    `# only enable rhel8 here -- don't want centos or epel ` \
    -e 's|^ *(COPY .*)/content_set.*repo (.+)|\1/content_sets_rhel8.repo \2|' \
  > "${TARGETDIR}/Dockerfile"

cat << EOT >> "${TARGETDIR}/Dockerfile"
ENV SUMMARY="Red Hat CodeReady Workspaces ${MIDSTM_NAME} container" \\
    DESCRIPTION="Red Hat CodeReady Workspaces ${MIDSTM_NAME} container" \\
    PRODNAME="codeready-workspaces" \\
    COMPNAME="${MIDSTM_NAME}-rhel8"
LABEL summary="\$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${CRW_VERSION}" \\
      license="EPLv2" \\
      maintainer="Eric Williams <ericwill@redhat.com>, Nick Boldt <nboldt@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"

# header to reattach to yaml files after yq transform removes it
COPYRIGHT="#
#  Copyright (c) 2021 Red Hat, Inc.
#    This program and the accompanying materials are made
#    available under the terms of the Eclipse Public License 2.0
#    which is available at https://www.eclipse.org/legal/epl-2.0/
#
#  SPDX-License-Identifier: EPL-2.0
#
#  Contributors:
#    Red Hat, Inc. - initial API and implementation
"

replaceField()
{
  theFile="$1"
  updateName="$2"
  updateVal="$3"
  echo "[INFO] ${0##*/} :: * ${updateName}: ${updateVal}"
  # shellcheck disable=SC2016 disable=SC2086
  changed=$(yq -Y --arg updateName "${updateName}" --arg updateVal "${updateVal}" ${updateName}' = $updateVal' "${theFile}")
  echo "${COPYRIGHT}${changed}" > "${theFile}"
}

pushd "${TARGETDIR}" >/dev/null || exit 1

# TODO transform che-theia references to CRW theia references, including:
# description, icon, attributes.version, attributes.title, attributes.repository

popd >/dev/null || exit
