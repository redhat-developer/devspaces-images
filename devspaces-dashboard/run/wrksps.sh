#!/bin/sh
#
# Copyright (c) 2021-2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# The script is used to backward compatibility between yarn3 and yarn1 package managers.
# It will be removed with yarn1 support.

set -e

yarn workspace @eclipse-che/common "$@"
yarn workspace @eclipse-che/dashboard-frontend "$@"
yarn workspace @eclipse-che/dashboard-backend "$@"
