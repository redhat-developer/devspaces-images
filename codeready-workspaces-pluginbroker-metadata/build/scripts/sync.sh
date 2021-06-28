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
SCRIPTS_DIR=$(cd "$(dirname "$0")"; pwd) # echo $SCRIPTS_DIR
ALT_SCRIPTS_DIR="${SCRIPTS_DIR/codeready-workspaces-pluginbroker-metadata/codeready-workspaces-pluginbroker-artifacts}"
if [[ -d ${ALT_SCRIPTS_DIR} ]] && [[ "${SCRIPTS_DIR}" != "${ALT_SCRIPTS_DIR}" ]]; then 
    echo "[WARN] Running ${ALT_SCRIPTS_DIR}/sync.sh, not $0 ..."
    "${ALT_SCRIPTS_DIR}/sync.sh" $*
else 
    echo "Could not compute path to codeready-workspaces-pluginbroker-artifacts/build/scripts/sync.sh from $SCRIPTS_DIR"
    echo "Please run this script from codeready-workspaces-pluginbroker-artifacts/build/scripts/sync.sh"
    exit 1
fi
