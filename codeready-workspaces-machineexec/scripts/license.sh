#!/bin/bash
# Copyright (c) 2019-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

export ROOT_DIR=$(dirname $(dirname $(readlink -f "$0")));

# Validate a Eclipse Che license header
function validateChectlLicenseHeader() {
    python "${ROOT_DIR}"/scripts/validate-license.py $(find "${ROOT_DIR}" -type d \( -path "${ROOT_DIR}"/vendor -o -path "${ROOT_DIR}"/templates \) -prune -false \
        -o -name '*.sh' -o -name '*.ts' -o -name '*.yml' -o -name '*.yaml' -o -name '*.go' \
        | grep -v vendor \
        | grep -v mocks)
}

# Add a license to a file without license
function addLicensetoChectlCode() {
    if ! command -v addlicense &> /dev/null
    then
        echo "Command addlicense not found locally. Please install it from https://github.com/google/addlicense."
        exit 1
    fi

    addlicense -v -f "${ROOT_DIR}"/license_header.txt $(find "${ROOT_DIR}" -type d \( -path "${ROOT_DIR}"/vendor \) -prune -false \
        -o -name '*.sh' -o -name '*.ts' -o -name '*.yml' -o -name '*.yaml' -o -name '*.go' \
        | grep -v mocks \
        | grep -v vendor)
}

# catch first arguments with $1
case "$1" in
 check)
  echo -e "[INFO] Launching Eclipse Che license header check."
  validateChectlLicenseHeader
  ;;
 add)
  echo -e "[INFO] Start adding Eclipse Che license headers to code."
  addLicensetoChectlCode
  ;;
 *)
  # else
  echo "Usage: 
    -c|--check-license: Check Eclipse license in codebase
    -a|--add-license: Add a license to codebase. The file should not have any license if you execute this command.
  "
  ;;
esac
