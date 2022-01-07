#!/bin/bash -xe

# Copyright (c) 2018-2021 Red Hat, Inc.
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

export KAMEL_VERSION="1.5.0"
export GOLANG_IMAGE="registry.access.redhat.com/ubi8/go-toolset:1.14.7-15"
ASSET_NAME="kamel"

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] -n [ASSET_NAME]
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
echo "CodeReady Workspaces :: Kamel"
echo ""

mkdir -p target/kamel

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
    curl -sSLo- https://github.com/apache/camel-k/archive/v${KAMEL_VERSION}.tar.gz | tar xz || true
    ls -1 camel*
    cd camel-k-${KAMEL_VERSION}
    make build-kamel
    cp  /tmp/camel-k-${KAMEL_VERSION}/kamel /kamel/kamel
    "
tar -czf "${tarball}" -C target/kamel .

# upload the binary to GH
if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
    curl -sSLO "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
fi
./uploadAssetsToGHRelease.sh --publish-assets -v "${CSV_VERSION}" -b "${MIDSTM_BRANCH}" -n ${ASSET_NAME} "${tarball}"

${PODMAN} rmi -f ${GOLANG_IMAGE}
