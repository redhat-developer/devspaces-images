#!/bin/bash
#
# Copyright (c) 2020-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
#include common scripts
. ./common.sh

usage="$(basename "$0") -- script for compile Go source and build docker images

usage:
    -t,--tag             tag name for docker images (default: next)
    -o,--organization    organization name for docker images (default: eclipse)
    -r,--repository      docker registry (default quay.io)
    -h,--help            show this help text"

#default
ORGANIZATION="eclipse"
TAG="next"
REPOSITORY="quay.io"

while [[ $# -gt 0 ]]
do
    key="${1}"
    case $key in
    -t|--tag)
        TAG="${2}"
        shift
        shift
        ;;
    -o|--organization)
        ORGANIZATION="${2}"
        shift
        shift
        ;;
    -r|--repository)
        REPOSITORY="${2}"
        shift
        shift
        ;;
    -h|--help)
        echo "$usage"
        exit 0
        ;;
    *) printf "illegal option: -%s\n" "$key"
       echo "$usage"
       exit 1
       ;;
    esac
done

compile;
dockerBuild "${TAG}" "${ORGANIZATION}";
