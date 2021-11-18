#!/bin/bash -xe

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

# shellcheck disable=SC2155
export SCRIPT_DIR=$(cd "$(dirname "$0")" || exit; pwd)
export OPENJDK11_IMAGE="registry.access.redhat.com/ubi8/openjdk-11:1.10"
export ANT_VERSION=1.10.12
export LOMBOK_VERSION=1.18.22

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] -n [ASSET_NAME]
Example: $0 -v 2.y.0 -n noarch
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

cd "$SCRIPT_DIR"
[[ -e target ]] && rm -Rf target

echo ""
echo "CodeReady Workspaces :: java plugin library :: lombok"
echo ""

mkdir -p target/lombok-ls

PODMAN=$(command -v podman || true)
if [[ ! -x $PODMAN ]]; then
  echo "[WARNING] podman is not installed."
 PODMAN=$(command -v docker || true)
  if [[ ! -x $PODMAN ]]; then
    echo "[ERROR] docker is not installed. Aborting."; exit 1
  fi
fi

${PODMAN} run --name lomboktmp -u root ${OPENJDK11_IMAGE} sh -c "
    microdnf update && microdnf install git && \
    curl -sSLO https://dlcdn.apache.org//ant/binaries/apache-ant-${ANT_VERSION}-bin.tar.gz \
    && tar xvfz apache-ant-${ANT_VERSION}-bin.tar.gz -C /opt \
    && ln -sfn /opt/apache-ant-${ANT_VERSION} /opt/ant \
    && echo ANT_HOME=/opt/ant >> /etc/environment \
    && ln -sfn /opt/ant/bin/ant /usr/bin/ant \
    && rm apache-ant-${ANT_VERSION}-bin.tar.gz && \
    git clone --quiet https://github.com/projectlombok/lombok.git lombok && \
    cd lombok && git checkout tags/v${LOMBOK_VERSION} -b v${LOMBOK_VERSION} && ant dist
    "
${PODMAN} cp lomboktmp:/home/jboss/lombok/dist/lombok-${LOMBOK_VERSION}.jar ${SCRIPT_DIR}/target/lombok-ls/
${PODMAN} rm -f lomboktmp

jarfile="${SCRIPT_DIR}/target/lombok-ls/lombok-${LOMBOK_VERSION}.jar"

# upload the binary to GH
if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
    curl -sSLO "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
fi
./uploadAssetsToGHRelease.sh --publish-assets -v "${CSV_VERSION}" -b "${MIDSTM_BRANCH}" -n ${ASSET_NAME} "${jarfile}"

${PODMAN} rmi -f ${OPENJDK11_IMAGE}
