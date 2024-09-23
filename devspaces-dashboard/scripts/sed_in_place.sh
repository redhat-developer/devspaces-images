#!/bin/bash
#
# Copyright (c) 2021-2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

set -e

SHORT_UNAME=$(uname -s)
if [ "$(uname)" == "Darwin" ]; then
  sed -i '' "$@"
elif [ "${SHORT_UNAME:0:5}" == "Linux" ]; then
  sed -i "$@"
else
  echo "Unknown OS"
  exit 1
fi

exit 0
