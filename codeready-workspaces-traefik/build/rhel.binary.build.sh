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

MIDSTM_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "crw-2-rhel-8")
if [[ ${MIDSTM_BRANCH} != "crw-"*"-rhel-"* ]]; then MIDSTM_BRANCH="crw-2-rhel-8"; fi

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION]
Example: $0 -v 2.y.0 
"
    exit
}

if [[ $# -lt 1 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; shift 1;;
    '-b') MIDSTM_BRANCH="$2"; shift 1;;
    '--help'|'-h') usage;;
  esac
  shift 1
done

# build the image
export TMP_IMG="traefik.tmp"
podman build -t $TMP_IMG -f build/rhel.binary.Dockerfile .

# extract the binary
mkdir -p brew-assets
podman run --rm -v ./brew-assets:/brew-assets $TMP_IMG sh -c "cp /go/src/github.com/traefik/traefik/dist/traefik /brew-assets"

# tar the binary
tarball="asset-traefik-$(uname -m).tar.gz"
tar czf "${tarball}" -C ./brew-assets .

# upload the binary to GH
if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
    curl -sSLO "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
fi
./uploadAssetsToGHRelease.sh -v "${CSV_VERSION}" "${tarball}"

# cleanup
podman rmi -f $TMP_IMG
