#!/bin/bash
#
# Copyright (c) 2021-2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# SPECIAL CASE: convert registry upper-midstream (devspaces repo, forked from upstream w/ different plugins) to lower-midstream (devspaces-images repo) using yq, sed
# https://github.com/redhat-developer/devspaces/tree/devspaces-3-rhel-8/dependencies to https://github.com/redhat-developer/devspaces-images

set -e

# defaults
CSV_VERSION=3.y.0 # csv 3.y.0
DS_VERSION=${CSV_VERSION%.*} # tag 3.y

UPSTM_NAME="che-plugin-registry"
MIDSTM_NAME="pluginregistry"

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] [-s /path/to/sources] [-t /path/to/generated] [-b DS_BRANCH]
Example: $0 -v 3.y.0 -s ${HOME}/devspaces -t /tmp/devspaces-images/devspaces-${MIDSTM_NAME} -b devspaces-3.y-rhel-8
"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-b') DS_BRANCH="$2"; shift 1;;
    # for CSV_VERSION = 2.2.0, get DS_VERSION = 2.2
    '-v') CSV_VERSION="$2"; DS_VERSION="${CSV_VERSION%.*}"; shift 1;;
    # paths to use for input and ouput
    '-s') SOURCEDIR="$2"; SOURCEDIR=${SOURCEDIR%/}/dependencies/${UPSTM_NAME};
        if [[ ! -d ${SOURCEDIR} ]]; then echo "Cannot find ${SOURCEDIR} !"; exit 1; fi;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    '--help'|'-h') usage;;
    # optional tag overrides
  esac
  shift 1
done

if [ "${CSV_VERSION}" == "3.y.0" ]; then usage; fi

# try to compute branches from currently checked out branch; else fall back to hard coded value for where to find 
# https://github.com/redhat-developer/devspaces-images/blob/${DS_BRANCH}/devspaces-operator-bundle-generated/manifests/devspaces.csv.yaml
if [[ -z ${DS_BRANCH} ]]; then 
  DS_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [[ $DS_BRANCH != "devspaces-3."*"-rhel-8" ]]; then
    DS_BRANCH="devspaces-3-rhel-8"
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

# CRW-1792 transform che-editors.yaml to refer to /latest
pushd "${TARGETDIR}" >/dev/null || exit 1
sed -i che-editors.yaml -r -e "s|/nightly|/latest|" -e "s|/next|/latest|"
popd >/dev/null || exit

# transform Dockerfile
# shellcheck disable=SC1004
sed "${TARGETDIR}/build/dockerfiles/Dockerfile" --regexp-extended \
    -e 's|rhel8/postgresql-13:([0-9]+)(-[0-9.]+)|rhel8/postgresql-13:\1|g' \
    `# Remove registry so build works in Brew` \
    -e "s#FROM (registry.access.redhat.com|registry.redhat.io)/#FROM #g" \
    -e 's|FROM registry.access.redhat.com/|FROM |' \
    -e 's|FROM registry.redhat.io/|FROM |' \
    `# Set arg options: disable BOOTSTRAP; update DS_BRANCH to correct value` \
    -e 's|ARG BOOTSTRAP=.*|ARG BOOTSTRAP=false|' \
    -e "s|ARG DS_BRANCH=.*|ARG DS_BRANCH=${DS_BRANCH}|" \
    `# Enable offline build - copy in built binaries` \
    -e 's|# (COPY root-local.tgz)|\1|' \
    `# only enable rhel8 here -- don't want centos or epel ` \
    -e 's|^ *(COPY .*)/content_set.*repo (.+)|\1/content_sets_rhel8.repo \2|' \
  > "${TARGETDIR}/Dockerfile"

cat << EOT >> "${TARGETDIR}/Dockerfile"
ENV SUMMARY="Red Hat OpenShift Dev Spaces ${MIDSTM_NAME} container" \\
    DESCRIPTION="Red Hat OpenShift Dev Spaces ${MIDSTM_NAME} container" \\
    PRODNAME="devspaces" \\
    COMPNAME="${MIDSTM_NAME}-rhel8"
LABEL summary="\$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${DS_VERSION}" \\
      license="EPLv2" \\
      maintainer="Valerii Svydenko <vsvydenk@redhat.com>, Nick Boldt <nboldt@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"

pushd "${TARGETDIR}" >/dev/null || exit 1

popd >/dev/null || exit
