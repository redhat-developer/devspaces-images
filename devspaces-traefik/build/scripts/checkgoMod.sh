#!/bin/bash
#
# Copyright (c) 2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# set rules for this build's go.mod file: cannot use dependencies > set limit
# see https://issues.redhat.com/browse/CRW-4868
# see https://github.com/cncf/foundation/issues/617

if [[ -f $1/go.mod ]]; then 
    goMod="$1/go.mod"
else
    echo "[ERROR] could not find go.mod file in $1 - must exit!"
    exit 3
fi

declare -A limits
declare -A links
limits["hashicorp/consul"]="v1.15.5"
links["hashicorp/consul"]="https://github.com/cncf/foundation/issues/617 and https://issues.redhat.com/browse/CRW-4868"
# add other array values here if there are more things to limit

checkVersion() {
    # $1 - upper limit version
    # $2 - actual version
    # $3 - versioned thing
    # #4 - link for more info
    if [[ "$1" = "$(echo -e "$1\n$2" | sort -rV | head -n1)" ]]; then
        # thing realversion <= upperlimitversion
        echo "[INFO] $3 version $2 <= $1: OK"
        true
    else 
        echo "[ERROR] $3 version $2 is not allowed. Must use $3 <= $1"
        echo "[ERROR] See $4 for more info"
        exit 2
    fi
}

echo "[INFO] Checking go.mod requirement upper limits..."
for i in "${!limits[@]}"; do
    lines="$(grep "$i " "$goMod")"
    for line in "$lines"; do
        version=$(echo "$line" | sed -r -e "s#.+$i ##"); # echo "Got version = $version"
        checkVersion ${limits[$i]} $version $i "${links[$i]}"
    done
done
