#!/bin/sh
#
# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

set -e
echo 'Starting Dashboard backend server...'
start_server="node /backend/server/backend.js --publicFolder /public"
$start_server &
wait
echo 'Dashboard backend server is stopped.'
