#!/bin/bash
set -xe

# Copyright (c) 2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# script to build rhel.Dockerfile and extract relevant assets for reuse in Brew

ARCH=$(uname -m)
TMPIMG=configbump:tmp-${ARCH}
PODMAN=$(command -v podman || true)
if [[ ! -x $PODMAN ]]; then
  echo "[WARNING] podman is not installed."
 PODMAN=$(command -v docker || true)
  if [[ ! -x $PODMAN ]]; then
    echo "[ERROR] docker is not installed. Aborting."; exit 1
  fi
fi

# shellcheck disable=SC2155
TMPDIR=$(mktemp -d)

if [[ ! ${WORKSPACE} ]]; then WORKSPACE=/tmp; fi

# delete any old assets
rm -fr ${TMPDIR} ${WORKSPACE}/asset-configbump-${ARCH}.tar.gz

# build the image
${PODMAN} build . -f build/dockerfiles/rhel.Dockerfile -t ${TMPIMG}

# extract files
# shellcheck disable=SC2043
for d in usr/local/bin/configbump; do 
    mkdir -p ${TMPDIR}/${d%/*}
    ${PODMAN} run --rm --entrypoint cat $TMPIMG /${d} > ${TMPDIR}/${d}
done

# create asset-* file
pushd ${TMPDIR} >/dev/null || exit 1
    tar cvzf "${WORKSPACE}/asset-configbump-${ARCH}.tar.gz" ./
popd >/dev/null || exit 1

 #cleanup
${PODMAN} rmi -f ${TMPIMG}
rm -fr ${TMPDIR}
