#!/bin/bash -xe

# Copyright (c) 2018-2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

usage () {
    echo "
Usage:   $0 -v [DS CSV_VERSION] -n [ASSET_NAME]
Example: $0 -v 2.y.0 -n udi
"
    exit
}

if [[ $# -lt 1 ]]; then usage; fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-v') CSV_VERSION="$2"; shift 1;;
    '-n') ASSET_NAME="$2"; shift 1;;
    '--help'|'-h') usage;;
  esac
  shift 1
done
./build/build_python.sh -v ${CSV_VERSION} -n ${ASSET_NAME}
./build/build_kamel.sh -v ${CSV_VERSION} -n ${ASSET_NAME}
./build/build_php.sh -v ${CSV_VERSION} -n ${ASSET_NAME}
./build/build_golang.sh -v ${CSV_VERSION} -n ${ASSET_NAME}
./build/build_lombok.sh -v ${CSV_VERSION} -n ${ASSET_NAME}
