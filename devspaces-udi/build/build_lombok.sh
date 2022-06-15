#!/bin/bash -xe

# Copyright (c) 2021-2022 Red Hat, Inc.
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
Usage:   $0 -v [DS CSV_VERSION] -n [ASSET_NAME]
Example: $0 -v 2.y.0 -n udi
"
    exit
}

if [[ $# -lt 1 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-b') MIDSTM_BRANCH="$2"; shift 1;;
    '-v') CSV_VERSION="$2"; shift 1;;
    '-n') ASSET_NAME="$2"; shift 1;;
    '--help'|'-h') usage;;
  esac
  shift 1
done

if [[ ! $MIDSTM_BRANCH ]]; then 
  MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "devspaces-3-rhel-8")
  if [[ ${MIDSTM_BRANCH} != "devspaces-"*"-rhel-"* ]]; then MIDSTM_BRANCH="devspaces-3-rhel-8"; fi
fi

cd "$SCRIPT_DIR"
[[ -e target ]] && rm -Rf target

echo ""
echo "Red Hat OpenShift Dev Spaces :: java plugin library :: lombok"
echo ""

# if version we want already exists we're done
if [[ ! $(curl -sSI https://github.com/redhat-developer/devspaces-images/releases/download/${CSV_VERSION}-${ASSET_NAME}-assets/lombok-${LOMBOK_VERSION}.jar | grep 404) ]]; then
  echo "Asset already exists: https://github.com/redhat-developer/devspaces-images/releases/download/${CSV_VERSION}-${ASSET_NAME}-assets/lombok-${LOMBOK_VERSION}.jar"
  echo "Nothing to do!"
  exit 0
fi

mkdir -p target/lombok

PODMAN=$(command -v podman || true)
if [[ ! -x $PODMAN ]]; then
  echo "[WARNING] podman is not installed."
 PODMAN=$(command -v docker || true)
  if [[ ! -x $PODMAN ]]; then
    echo "[ERROR] docker is not installed. Aborting."; exit 1
  fi
fi

if [[ ! ${WORKSPACE} ]]; then WORKSPACE=/tmp; fi
jarfile="${WORKSPACE}/lombok-${LOMBOK_VERSION}.jar"

${PODMAN} run --rm -v "$SCRIPT_DIR"/target/lombok:/tmp/lombok -u root ${OPENJDK11_IMAGE} sh -c "
    microdnf update && microdnf install git && \
    cd /tmp && \
    curl -sSLO https://dlcdn.apache.org/ant/binaries/apache-ant-${ANT_VERSION}-bin.tar.gz \
    && tar xvfz apache-ant-${ANT_VERSION}-bin.tar.gz -C /opt \
    && ln -sfn /opt/apache-ant-${ANT_VERSION} /opt/ant \
    && echo ANT_HOME=/opt/ant >> /etc/environment \
    && ln -sfn /opt/ant/bin/ant /usr/bin/ant \
    && rm apache-ant-${ANT_VERSION}-bin.tar.gz && \
    git clone --quiet https://github.com/projectlombok/lombok.git lombok && \
    cd /tmp/lombok && git checkout tags/v${LOMBOK_VERSION} -b v${LOMBOK_VERSION} && ant dist && \
    chmod -R 777 /tmp/lombok
    "
cp target/lombok/dist/lombok-${LOMBOK_VERSION}.jar "${jarfile}"

# upload the binary to GH
if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
    curl -sSLO "https://raw.githubusercontent.com/redhat-developer/devspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
fi
result="$(./uploadAssetsToGHRelease.sh --publish-assets -v "${CSV_VERSION}" -b "${MIDSTM_BRANCH}" -n ${ASSET_NAME} "${jarfile}" || true)"
if [[ "$result" == *"Duplicate value for "* ]]; then
  echo "[WARNING] ${jarfile} already present at https://github.com/redhat-developer/devspaces-images/releases/tag/${CSV_VERSION}-${ASSET_NAME}-assets "
fi

${PODMAN} rmi -f ${OPENJDK11_IMAGE}
