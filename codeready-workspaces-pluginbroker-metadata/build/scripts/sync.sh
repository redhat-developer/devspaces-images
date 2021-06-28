#!/bin/bash
#
# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# convert che-plugin-broker upstream to crw-pluginbroker-* downstream using yq, sed, and deleting files

# NOTE: this script is a wrapper for the actual sync.sh script in 
# codeready-workspaces-pluginbroker-artifacts/build/scripts/sync.sh

# shellcheck disable=SC2164
SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd)
echo $SCRIPTS_DIR
if [[ -d ${SCRIPTS_DIR/-metadata/-artifacts} ]] && [[ "${SCRIPTS_DIR}" != "${SCRIPTS_DIR/-metadata/-artifacts}" ]]; then 
    echo "[WARN] Running ${SCRIPTS_DIR/-metadata/-artifacts}/sync.sh, not $0 ..."
    "${SCRIPTS_DIR/-metadata/-artifacts}/sync.sh" $*
else 
    echo "Please run this script from codeready-workspaces-pluginbroker-artifacts/build/scripts/sync.sh"
    exit 1
fi