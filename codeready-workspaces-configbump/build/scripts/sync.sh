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
# convert upstream repo to midstream crw-images repo using yq, sed

set -e

# defaults
CSV_VERSION=2.y.0 # csv 2.y.0
CRW_VERSION=${CSV_VERSION%.*} # tag 2.y
SYNC_REPO="configbump"

usage () {
    echo "
Usage:   $0 -v [CRW CSV_VERSION] [-s /path/to/${SYNC_REPO}] [-t /path/to/generated]
Example: $0 -v 2.y.0 -s ${HOME}/projects/${SYNC_REPO} -t /tmp/${SYNC_REPO}"
    exit
}

if [[ $# -lt 6 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CRW_VERSION="$2"; shift 1;;
    # paths to use for input and output
    '-s') SOURCEDIR="$2"; SOURCEDIR="${SOURCEDIR%/}"; shift 1;;
    '-t') TARGETDIR="$2"; TARGETDIR="${TARGETDIR%/}"; shift 1;;
    # special params for this sync
    '--help'|'-h') usage;;
  esac
  shift 1
done

if [[ ! -d "${SOURCEDIR}" ]]; then usage; fi
if [[ ! -d "${TARGETDIR}" ]]; then usage; fi
if [[ "${CRW_VERSION}" == "2.y" ]]; then usage; fi

# ignore changes in these files
echo ".github
.gitattributes
" > /tmp/rsync-upstream-exclude
#ignore files that are ONLY in downstream (not midstream or upstream)
echo "sources
get-sources-jenkins.sh
cvp.yml
tests/
content_sets.yml
content_sets.repo
container.yaml
.gitignore
"> /tmp/rsync-brew-exclude

echo "Rsync ${SOURCEDIR} to ${TARGETDIR}"
rsync -avhz --checksum --exclude-from /tmp/rsync-upstream-exclude --exclude-from /tmp/rsync-brew-exclude --exclude .git/ --exclude .github/ --exclude .gitignore "${SOURCEDIR}"/ "${TARGETDIR}"

#copy build/dockerfiles/brew.Dockerfile to Dockerfile
rsync -avhz --checksum "${SOURCE_DIR}"/build/dockerfiles/brew.Dockerfile "${TARGET_DIR}"/Dockerfile

rm -f /tmp/rsync-upstream-exclude /tmp/rsync-brew-exclude

#append brew metadata to brew.Dockerfile after copying to downstream

METADATA='ENV SUMMARY="Red Hat CodeReady Workspaces ${SYNC_REPO} container" \\\r
DESCRIPTION="Red Hat CodeReady Workspaces ${SYNC_REPO} container" \\\r
PRODNAME="codeready-workspaces" \\\r
COMPNAME="${SYNC_REPO}-rhel8" \r
LABEL summary="$SUMMARY" \\\r
description="$DESCRIPTION" \\\r
io.k8s.description="$DESCRIPTION" \\\r
io.k8s.display-name=\"$DESCRIPTION" \\\r
io.openshift.tags="$PRODNAME,$COMPNAME" \\\r
com.redhat.component="$PRODNAME-$COMPNAME-container" \\\r
name="$PRODNAME/$COMPNAME" \\\r
version="${CRW_VERSION}" \\\r
license="EPLv2" \\\r
maintainer="Nick Boldt <nboldt@redhat.com>" \\\r
io.openshift.expose-services="" \\\r
usage="" \r'
echo -e "$METADATA" >> $TARGET_DIR/Dockerfile
echo "Converted Dockerfile"