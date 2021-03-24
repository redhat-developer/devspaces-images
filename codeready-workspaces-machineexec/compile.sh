#!/bin/bash
#
# Copyright (c) 2012-2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

function compile() {

    echo "===> Compile che-machine-exec binary from source code. <===";

    $(CGO_ENABLED=0 GOOS=linux go build -mod=vendor -a -ldflags '-w -s' -a -installsuffix cgo -o che-machine-exec .);

    if [ $? != 0 ]; then
        echo "Failed to compile code";
        exit 0;
    fi

    echo "============ Compilation successfully completed. ============";
}

compile;
