#!/bin/bash
#
# Copyright (c) 2019-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

export ROOT_DIR=$(dirname $(dirname $(readlink -f "$0")));

function setUpCodeBaseFileList() {
  CODE_BASE_FILES=$(find "${ROOT_DIR}" -type d \( -path "${ROOT_DIR}"/vendor -o -path "${ROOT_DIR}"/templates \) -prune -false \
        -o -name '*.sh' -o -name '*.ts' -o -name '*.yml' -o -name '*.yaml' -o -name '*.go' \
        | grep -v vendor \
        | grep -v mocks)
}

# Validate a license headers in the codebase.
function validateLicenseHeader() {
  if ! command -v check-license-header &> /dev/null; then
    echo "Command 'check-license-header' not found locally. Please install it from https://github.com/che-incubator/check-license-header".
    exit 1
  fi
  setUpCodeBaseFileList
  check-license-header -f "${ROOT_DIR}"/hack/license_header.txt ${CODE_BASE_FILES}
}

# Add a license to a files without license.
function addLicensesToCode() {
  if ! command -v addlicense &> /dev/null
  then
    echo "Command 'addlicense' not found locally. Please install it from https://github.com/google/addlicense."
    exit 1
  fi

  setUpCodeBaseFileList
  addlicense -v -f "${ROOT_DIR}"/hack/license_header.txt ${CODE_BASE_FILES}
}

# catch first arguments with $1
case "$1" in
 check)
  echo -e "[INFO] Launching Eclipse Che license header check."
  validateLicenseHeader
  ;;
 add)
  echo -e "[INFO] Start adding Eclipse Che license headers to code."
  addLicensesToCode
  ;;
 *)
  # else
  echo "Usage: 
    'check' - check Eclipse license in codebase.
    'add'   - add a license header in the files if not present.
  "
  ;;
esac
