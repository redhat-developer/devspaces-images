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
# build asset* files

set -e

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
SYNC_REPO="traefik"
UPLOAD_TO_GH=1

MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "crw-2-rhel-8")
if [[ ${MIDSTM_BRANCH} != "crw-"*"-rhel-"* ]]; then MIDSTM_BRANCH="crw-2-rhel-8"; fi

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] [--noupload] [-b MIDSTM_BRANCH] [-ght GITHUB_TOKEN]
Example: $0 -v 2.y.0 --noupload
"
    exit
}

if [[ $# -lt 1 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; shift 1;;
    '-b') MIDSTM_BRANCH="$2"; shift 1;;
    '-ght') GITHUB_TOKEN="$2"; export GITHUB_TOKEN="${GITHUB_TOKEN}"; shift 1;;
    '-n'|'--noupload') UPLOAD_TO_GH=0;;
    '--help'|'-h') usage;;
  esac
  shift 1
done

ARCH="$(uname -m)"

PODMAN=$(command -v podman || true)
if [[ ! -x $PODMAN ]]; then
  echo "[WARNING] podman is not installed."
 PODMAN=$(command -v docker || true)
  if [[ ! -x $PODMAN ]]; then
    echo "[ERROR] docker is not installed. Aborting."; exit 1
  fi
fi

# shellcheck disable=SC2155
export RUN_DIR=$(cd "$(dirname "$0")"/.. || exit; pwd); # echo $RUN_DIR; exit
cd "$RUN_DIR"
[[ -e target ]] && rm -Rf target

# build the image
export TMP_IMG="traefik.tmp"
${PODMAN} build -t $TMP_IMG -f build/rhel.binary.Dockerfile .

# extract the binary
mkdir -p target/brew-assets
${PODMAN} run --rm -v "${RUN_DIR}"/target/brew-assets:/tmp/brew-assets -u root ${TMP_IMG} sh -c \
  "cp /go/src/github.com/traefik/traefik/dist/traefik /tmp/brew-assets"

# tar the binary
tarball="asset-${SYNC_REPO}-${ARCH}.tar.gz"
tar -czf "${tarball}" -C target/brew-assets .

if [[ ${UPLOAD_TO_GH} -eq 1 ]]; then
  # upload the binary to GH
  if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
      curl -sSLO "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
  fi
  ./uploadAssetsToGHRelease.sh -v "${CSV_VERSION}" -b "${MIDSTM_BRANCH}" --asset-name "${SYNC_REPO}" "${tarball}"

  # cleanup
  podman rmi -f $TMP_IMG
  rm -fr target/brew-assets
fi
