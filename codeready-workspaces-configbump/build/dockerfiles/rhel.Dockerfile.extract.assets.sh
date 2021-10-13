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
PODMAN=podman; if [[ ! $(which podman) ]]; then PODMAN=docker;fi
TMPDIR=$(mktemp -d)

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

# upload the binary to GH
if [[ ! -x ./uploadAssetsToGHRelease.sh ]]; then 
    curl -sSLO "https://raw.githubusercontent.com/redhat-developer/codeready-workspaces/${MIDSTM_BRANCH}/product/uploadAssetsToGHRelease.sh" && chmod +x uploadAssetsToGHRelease.sh
fi
./uploadAssetsToGHRelease.sh -v "${CSV_VERSION}" -b "${MIDSTM_BRANCH}" --prefix configbump "${WORKSPACE}/asset-configbump-${ARCH}.tar.gz"


 #cleanup
${PODMAN} rmi -f ${TMPIMG}
rm -fr ${TMPDIR}
