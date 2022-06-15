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
UPLOAD_TO_GH=1

MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "devspaces-3-rhel-8")
if [[ ${MIDSTM_BRANCH} != "devspaces-"*"-rhel-"* ]]; then MIDSTM_BRANCH="devspaces-3-rhel-8"; fi

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] [--noupload] [-ght GITHUB_TOKEN] -n [ASSET_NAME]
Example: $0 -v 2.y.0 --noupload -n configbump
"
    exit
}

if [[ $# -lt 1 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; shift 1;;
    '-ght') GITHUB_TOKEN="$2"; export GITHUB_TOKEN="${GITHUB_TOKEN}"; shift 1;;
    '-n') ASSET_NAME="$2"; shift 1;;
    '--noupload') UPLOAD_TO_GH=0;;
    '--help'|'-h') usage;;
  esac
  shift 1
done

ARCH="$(uname -m)"
chmod +x ./build/dockerfiles/*.sh
./build/dockerfiles/rhel.Dockerfile.extract.assets.sh

if [[ ! ${WORKSPACE} ]]; then WORKSPACE=/tmp; fi
tarball="${WORKSPACE}/asset-${ASSET_NAME}-${ARCH}.tar.gz"
if [[ ${UPLOAD_TO_GH} -eq 1 ]]; then
  # upload the binary to GH
  if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
      curl -sSLO "https://raw.githubusercontent.com/redhat-developer/devspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
  fi
  # delete existing release & tag & assets -- this will remove everything for each push for each arch, so can't be done here
  # ./uploadAssetsToGHRelease.sh --delete-assets -v "${CSV_VERSION}" -b "${MIDSTM_BRANCH}" --asset-name "${SYNC_REPO}"
  # create a new release & tag w/ fresh assets
  ./uploadAssetsToGHRelease.sh --publish-assets -v "${CSV_VERSION}" -b "${MIDSTM_BRANCH}" --asset-name "${ASSET_NAME}" "${tarball}"
fi
