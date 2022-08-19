#!/bin/bash
#
# Copyright (c) 2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# verify that if we're building a stable branch build, we don't
# have quay.io references (only RH Ecosystem Catalog references)
# pass in space-separated list of acceptable registries
set -e

while [[ "$#" -gt 0 ]]; do
	case $1 in
		*) ALLOWED_REGISTRIES="${ALLOWED_REGISTRIES} $1";;
	esac
	shift 1
done

# if no registries set, then all registries are allowed
if [[ $ALLOWED_REGISTRIES ]]; then 
    script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    containers=$(${script_dir}/list_referenced_images.sh .)
    for container in $containers; do
        registry_passed=""
        for registry in $ALLOWED_REGISTRIES; do
            if [[ $container == "$registry/"* ]]; then
                registry_passed="$registry"
            fi
        done
        if [[ $registry_passed != "" ]]; then
            echo " + $container PASS - $registry_passed allowed"
        else
            echo " - $container FAIL - not in allowed registries: '$ALLOWED_REGISTRIES'"
            exit 1
        fi
    done
fi