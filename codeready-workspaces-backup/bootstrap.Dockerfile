# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/go-toolset
FROM registry.access.redhat.com/ubi8/go-toolset:1.16.12-4 as builder
ENV GOPATH=/tmp/go/

ENV REST_SERVER_TAG=v0.10.0
RUN export ARCH="$(uname -m)" && \
    if [[ ${ARCH} == "x86_64" ]]; then export ARCH="amd64"; \
    elif [[ ${ARCH} == "aarch64" ]]; then export ARCH="arm64"; \
    fi && \
    mkdir -p $GOPATH && cd $GOPATH && \
    git clone --depth 1 --branch $REST_SERVER_TAG https://github.com/restic/rest-server.git && \
    cd rest-server && \
    go mod vendor && \
    GOOS=linux GOARCH=${ARCH} CGO_ENABLED=0 go build -mod=vendor -o rest-server ./cmd/rest-server

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/ubi-micro
FROM registry.access.redhat.com/ubi8/ubi-micro:8.5-744

COPY --from=builder /tmp/go/rest-server/rest-server /usr/local/bin/rest-server
COPY --from=builder /tmp/go/rest-server/LICENSE /usr/local/bin/rest-server-LICENSE.txt

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
