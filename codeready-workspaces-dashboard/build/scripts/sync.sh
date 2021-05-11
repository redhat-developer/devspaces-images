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

SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y

UPDATE_VENDOR=0 # vendoring will be done in get-sources*.sh just before the brew build, so we can also commit the tarball

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] [-s /path/to/sources] [-t /path/to/generated]
Example: $0 -v 2.y.0 -s ${HOME}/projects/dashboard -t /tmp/dashboard"
#echo "Options:
#    --no-vendor # don't rebuild the vendor folder"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    # for CSV_VERSION = 2.2.0, get CRW_VERSION = 2.2
    '-v') CSV_VERSION="$2"; CRW_VERSION="${CSV_VERSION%.*}"; shift 1;;
    # paths to use for input and ouput
    '-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    # '--no-vendor') UPDATE_VENDOR=0;;
    '--help'|'-h') usage;;
    # optional tag overrides
  esac
  shift 1
done

if [ "${CSV_VERSION}" == "2.y.0" ]; then usage; fi

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
build/scripts/sync.sh
get-sources-jenkins.sh
container.yaml
content_sets.yml
" > /tmp/rsync-excludes
echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rm -fr ${TARGETDIR}/vendor/
rsync -azrlt --checksum --exclude-from /tmp/rsync-excludes --delete ${SOURCEDIR}/ ${TARGETDIR}/
rm -f /tmp/rsync-excludes

# transform rhel.Dockefile -> Dockerfile
sed ${TARGETDIR}/build/dockerfiles/rhel.Dockerfile -r \
    -e "s#FROM registry.redhat.io/#FROM #g" \
    -e "s#FROM registry.access.redhat.com/#FROM #g" \
    -e "/RUN \/dashboard\/.yarn\/releases\/yarn-\*.cjs install/i COPY asset-yarn-cache.tgz /tmp/\nRUN tar xzf /tmp/asset-yarn-cache.tgz && rm -f /tmp/asset-yarn-cache.tgz" \
> ${TARGETDIR}/Dockerfile
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
      maintainer="Josh Pinkney <jpinkney@redhat.com>, Nick Boldt <nboldt@redhat.com>" \\
      io.openshift.expose-services="" \\
      usage=""
EOT
echo "Converted Dockerfile"

# do vendoring downstream as part of get-sources-jenkins.sh (if nothing is arch-specific, we can do it later)
# if [[ ${UPDATE_VENDOR} -eq 1 ]]; then
#     BOOTSTRAPFILE=${TARGETDIR}/bootstrap.Dockerfile
#     # with yarn 2, no need to change the dockerfile (unlike with go vendoring or yarn 1)
#     cp ${TARGETDIR}/build/dockerfiles/rhel.Dockerfile ${BOOTSTRAPFILE}
#     tag=$(pwd);tag=${tag##*/}
#     ${BUILDER} build . -f ${BOOTSTRAPFILE} --target builder -t ${tag}:bootstrap # --no-cache
#     rm -f ${BOOTSTRAPFILE}

#     # step two - extract cache folder to tarball
#     ${BUILDER} run --rm --entrypoint sh ${tag}:bootstrap -c 'tar -pzcf - .yarn/cache' > "asset-yarn-cache-$(uname -m).tgz"

#     pushd "${TARGETDIR}" >/dev/null || exit 1
#         # step three - include that tarball's contents in this repo, under the cache folder
#         tar -xzf "asset-yarn-cache-$(uname -m).tgz"
#         git add .yarn/cache || true
#     popd || exit
#     echo "Collected .yarn/cache/ folder - don't forget to commit it and sync it downstream"

#     # cleanup
#     rm -f "${TARGETDIR}/asset-vendor-$(uname -m).tgz"
#     ${BUILDER} rmi ${tag}:bootstrap
# fi
