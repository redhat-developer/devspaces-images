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
# convert devworkspace-operator upstream to downstream using yq, jq, sed & perl transforms, and deleting files

set -e

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y
UBI_TAG=8.3

UPDATE_VENDOR=1 # update the cache folder via bootstrap.Dockerfile

usage () {
    echo "
Usage:   $0 [-s /path/to/sources] [-t /path/to/generated]
Example: $0 -s ${HOME}/projects/dashboard -t /tmp/dashboard
Options:
	--ubi-tag ${UBI_TAG}
	--no-cache # don't rebuild the cache folder
"
    exit
}

if [[ $# -lt 4 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    # paths to use for input and ouput
    '-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    '--no-cache') UPDATE_VENDOR=0;;
    '--help'|'-h') usage;;
    # optional tag overrides
    '--ubi-tag') UBI_TAG="$2"; shift 1;;
  esac
  shift 1
done

CRW_RRIO="registry.redhat.io/codeready-workspaces"
CRW_DWO_IMAGE="${CRW_RRIO}/dashboard-rhel8:${CRW_VERSION}"
UBI_IMAGE="registry.redhat.io/ubi8/ubi-minimal:${UBI_TAG}"

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
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes ${SOURCEDIR}/* ${TARGETDIR}/
rm -f /tmp/rsync-excludes

# transform rhel.Dockefile -> Dockerfile
sed ${TARGETDIR}/dockerfiles/rhel.Dockerfile -r \
    -e "s#FROM registry.redhat.io/#FROM #g" \
    -e "s#FROM registry.access.redhat.com/#FROM #g" \
> ${TARGETDIR}/Dockerfile

ls

cat << EOT >> ${TARGETDIR}/Dockerfile
ENV SUMMARY="Red Hat CodeReady Workspaces dashboard container" \\
    DESCRIPTION="Red Hat CodeReady Workspaces dashboard container" \\
    PRODNAME="codeready-workspaces" \\
    COMPNAME="dashboard-rhel8"
LABEL summary="$SUMMARY" \\
      description="\$DESCRIPTION" \\
      io.k8s.description="\$DESCRIPTION" \\
      io.k8s.display-name="\$DESCRIPTION" \\
      io.openshift.tags="\$PRODNAME,\$COMPNAME" \\
      com.redhat.component="\$PRODNAME-\$COMPNAME-container" \\
      name="\$PRODNAME/\$COMPNAME" \\
      version="${CRW_VERSION}" \\
      license="EPLv2" \\
      maintainer="Josh Pinkney <jpinkney@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"

if [[ ${UPDATE_VENDOR} -eq 1 ]]; then
    BOOTSTRAPFILE=${TARGETDIR}/bootstrap.Dockerfile
    cat ${TARGETDIR}/dockerfiles/rhel.Dockerfile > ${BOOTSTRAPFILE}
    tag=$(pwd);tag=${tag##*/}
    ${BUILDER} build . -f ${BOOTSTRAPFILE} --target builder -t ${tag}:bootstrap # --no-cache
    rm -f ${BOOTSTRAPFILE}

    # step two - extract cache folder to tarball
    ${BUILDER} run --rm --entrypoint sh ${tag}:bootstrap -c 'tar -pzcf - .yarn/cache' > "asset-vendor-$(uname -m).tgz"
    ${BUILDER} rmi ${tag}:bootstrap

    pushd "${TARGETDIR}" >/dev/null || exit 1
        # step three - include that tarball's contents in this repo, under the yarn cache folder
        tar --strip-components=1 -xzf "asset-vendor-$(uname -m).tgz"
        rm -f "asset-vendor-$(uname -m).tgz"
        git add .yarn/cache || true
    popd || exit
    echo "Collected .yarn/cache/ folder - don't forget to commit it and sync it downstream"
fi
