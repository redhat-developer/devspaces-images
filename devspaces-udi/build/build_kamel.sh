#!/bin/bash -xe

# Copyright (c) 2018-2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# shellcheck disable=SC2155
export SCRIPT_DIR=$(cd "$(dirname "$0")" || exit; pwd)

export KAMEL_VERSION="1.7.0"
# get latest tag from https://catalog.redhat.com/software/containers/ubi8/go-toolset/5ce8713aac3db925c03774d1
export GOLANG_IMAGE="registry.access.redhat.com/ubi8/go-toolset:1.16.12-2"

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] -n [ASSET_NAME]
Example: $0 -v 2.y.0 -n udi
"
    exit
}

if [[ $# -lt 1 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; shift 1;;
    '-n') ASSET_NAME="$2"; shift 1;;
    '--help'|'-h') usage;;
  esac
  shift 1
done

cd "${SCRIPT_DIR}"
[[ -e target ]] && rm -Rf target

echo ""
echo "Red Hat OpenShift Dev Spaces :: Kamel"
echo ""

mkdir -p target/kamel
# include content set so we can resolve openshift-clients
cp ${SCRIPT_DIR}/../content_set*.repo target/kamel/ # ls -1 target/kamel/content_set*.repo

PODMAN=$(command -v podman || true)
if [[ ! -x $PODMAN ]]; then
  echo "[WARNING] podman is not installed."
 PODMAN=$(command -v docker || true)
  if [[ ! -x $PODMAN ]]; then
    echo "[ERROR] docker is not installed. Aborting."; exit 1
  fi
fi

ARCH="$(uname -m)"
if [[ ! ${WORKSPACE} ]]; then WORKSPACE=/tmp; fi
tarball="${WORKSPACE}/asset-kamel-${ARCH}.tar.gz"

${PODMAN} run --rm -v "${SCRIPT_DIR}"/target/kamel:/kamel -u root ${GOLANG_IMAGE} sh -c "
    cd /tmp
    cp /kamel/content_set*.repo /etc/yum.repos.d/
    yum install -y bash tar gzip which dnf openshift-clients
    curl -sSLo- https://github.com/apache/camel-k/archive/v${KAMEL_VERSION}.tar.gz | tar xz || true
    ls -1 camel*
    cd camel-k-${KAMEL_VERSION}
    make build-kamel
    cp  /tmp/camel-k-${KAMEL_VERSION}/kamel /kamel/kamel
    "

# exclude content set from tarball
rm -f target/kamel/content_set*.repo
tar -czf "${tarball}" -C target/kamel .

# upload the binary to GH
if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
    curl -sSLO "https://raw.githubusercontent.com/redhat-developer/devspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
fi
./uploadAssetsToGHRelease.sh --publish-assets -v "${CSV_VERSION}" -b "${MIDSTM_BRANCH}" -n ${ASSET_NAME} "${tarball}"

${PODMAN} rmi -f ${GOLANG_IMAGE}
