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
export PYTHON_LS_VERSION=0.36.1
export PYTHON_IMAGE="registry.access.redhat.com/ubi8/python-38:1"

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

cd "$SCRIPT_DIR"
[[ -e target ]] && rm -Rf target

PODMAN=$(command -v podman || true)
if [[ ! -x $PODMAN ]]; then
  echo "[WARNING] podman is not installed."
 PODMAN=$(command -v docker || true)
  if [[ ! -x $PODMAN ]]; then
    echo "[ERROR] docker is not installed. Aborting."; exit 1
  fi
fi

#Python build
echo ""
echo "Red Hat OpenShift Dev Spaces :: Stacks :: Language Servers :: Python Dependencies"
echo ""

mkdir -p target/python-ls

ARCH="$(uname -m)"
if [[ ! ${WORKSPACE} ]]; then WORKSPACE=/tmp; fi
tarball="${WORKSPACE}/asset-python-ls-${ARCH}.tar.gz"

${PODMAN} run --rm -v "$SCRIPT_DIR"/target/python-ls:/tmp/python -u root ${PYTHON_IMAGE} sh -c "
    /usr/bin/python3 --version && /usr/bin/python3 -m pip --version && \
    /usr/bin/python3 -m pip install -q --upgrade  --no-warn-script-location pip --prefix=/tmp/python && \
    /usr/bin/python3 -m pip install -q --no-warn-script-location python-language-server[all]==${PYTHON_LS_VERSION} ptvsd jedi ipykernel jupyter wrapt --prefix=/tmp/python && \
    /usr/bin/python3 -m pip install -q --no-warn-script-location pylint --prefix=/tmp/python && \
    chmod -R 777 /tmp/python && \
    # fix exec line in pylint executable to use valid python interpreter - replace /opt/app-root/ with /usr/
    for d in \$(find /tmp/python/bin -type f); do sed -i \${d} -r -e 's#/opt/app-root/#/usr/#'; done && 
    export PATH=\${PATH}:/tmp/python/bin
    ls -1 /tmp/python/bin
    # cat /tmp/python/bin/pylint
    mkdir -p /home/user; cd /home/user
    /usr/bin/python3 -m venv .venv;
    source .venv/bin/activate;
    pip install -U pylint ipykernel jupyter;
    python3 -m ipykernel install --name=.venv;
    deactivate;
    mv .venv /tmp/python/
    "
tar -czf "${tarball}" -C target/python-ls .

# upload the binary to GH
if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
    curl -sSLO "https://raw.githubusercontent.com/redhat-developer/devspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
fi
./uploadAssetsToGHRelease.sh --publish-assets -v "${CSV_VERSION}" -b "${MIDSTM_BRANCH}" -n ${ASSET_NAME} "${tarball}"

${PODMAN} rmi -f ${PYTHON_IMAGE}
