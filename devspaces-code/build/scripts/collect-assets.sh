#!/bin/bash
#
# Copyright (c) 2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# commandline args
while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-t') DS_VERSION="$2"; shift 1;; # get tag version (3.y), not csv version (3.y.z)
  esac
  shift 1
done

if [[ ! ${DS_VERSION} ]]; then
    log "[ERROR] DS_VERSION not defined, so cannot proceed with collecting assets."
    exit 1;
fi

ARCH="$(uname -m)"
LIBC_CONTENT_IMAGE=libc-content-provider
MACHINE_EXEC_IMAGE=quay.io/devspaces/machineexec-rhel8:$DS_VERSION

SCRIPT_PATH="$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)"
BASE_DIR_PATH="${SCRIPT_PATH}/../.."
DOCKERFILES_PATH="${BASE_DIR_PATH}/build/dockerfiles"

#### libc-content ####
collect_libc_content_assets() {
    docker build -f "${DOCKERFILES_PATH}/libc-content-provider.Dockerfile" --build-arg GITHUB_TOKEN=$GITHUB_TOKEN -t $LIBC_CONTENT_IMAGE .

    id="$(docker create $LIBC_CONTENT_IMAGE)"
    docker cp "$id":/checode-linux-libc - | gzip -9 > asset-libc-content-${ARCH}.tar.gz 
    docker rm -v $id
    docker rmi $(docker images $LIBC_CONTENT_IMAGE -a -q)
}

#### machine-exec ####
collect_machine_exec_assets() {
    echo "Using ${MACHINE_EXEC_IMAGE} to prepare machine-exec asset"

    id="$(docker create $MACHINE_EXEC_IMAGE)"
    docker cp "$id":/go/bin/che-machine-exec - | gzip -9 > asset-machine-exec.tar.gz 
    docker rm -v $id
    docker rmi $(docker images $MACHINE_EXEC_IMAGE -a -q)
}

collect_machine_exec_assets
collect_libc_content_assets
