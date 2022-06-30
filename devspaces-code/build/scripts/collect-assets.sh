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

# the version is updated automatically (see sync.sh)
DS_VERSION=3.1
LINUX_LIBC_IMAGE=linux-libc-amd64:latest
MACHINE_EXEC_IMAGE=quay.io/devspaces/machineexec-rhel8:$DS_VERSION

SCRIPT_PATH="$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)"
BASE_DIR_PATH="${SCRIPT_PATH}/../.."
DOCKERFILES_PATH="${BASE_DIR_PATH}/build/dockerfiles"

#### linux-libc-content ####
collect_linux_libc_content_assets() {
    docker build -f "${DOCKERFILES_PATH}/linux-libc.Dockerfile" -t $LINUX_LIBC_IMAGE .

    id="$(docker create $LINUX_LIBC_IMAGE)"
    docker cp "$id":/checode-linux-libc - | gzip -9 > asset-linux-libc.tar.gz 
    docker rm -v $id
    docker rmi $(docker images $LINUX_LIBC_IMAGE -a -q)
}

#### machine-exec ####
collect_machine_exec_assets() {
    echo "Using ${MACHINE_EXEC_IMAGE} to prepare machine-exec asset"

    id="$(docker create $MACHINE_EXEC_IMAGE)"
    docker cp "$id":/go/bin/che-machine-exec - | gzip -9 > asset-machine-exec.tar.gz 
    docker rm -v $id
    docker rmi $(docker images $MACHINE_EXEC_IMAGE -a -q)
}

### entrypoints ###
collect_entrypoints_assets() {
    (cd $SCRIPT_PATH && tar -cvf ${BASE_DIR_PATH}/asset-entrypoints.tar.gz entrypoint*.sh)
}

collect_machine_exec_assets
collect_linux_libc_content_assets
collect_entrypoints_assets
