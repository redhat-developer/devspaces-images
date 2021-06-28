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

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/go-toolset
FROM registry.access.redhat.com/ubi8/go-toolset:1.15.7-11 as builder
ENV GOPATH=/go/ \
    CGO_ENABLED=0 \
    GOOS=linux
USER root
WORKDIR /app
ENV GO111MODULE on
# ENV GOPROXY https://goproxy.io
COPY go.mod .
COPY go.sum .
RUN go mod download && go mod verify
COPY . ./

RUN adduser appuser && \
    go test -v  ./... && \
    export ARCH="$(uname -m)" && if [[ ${ARCH} == "x86_64" ]]; then export ARCH="amd64"; elif [[ ${ARCH} == "aarch64" ]]; then export ARCH="arm64"; fi && \
    CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -a -ldflags '-w -s' -a -installsuffix cgo -o configbump cmd/configbump/main.go
    
# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-micro
FROM registry.access.redhat.com/ubi8-micro:8.4-72
USER appuser
COPY --from=builder /app/configbump /usr/local/bin/configbump
ENTRYPOINT [ "/usr/local/bin/configbump" ]
