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

# this container build creates configbump binary, which can then be extracted with rhel.Dockefile.extract.assets.sh
# so we can use asset-*.tar.gz files for all arches in brew.Dockerfile

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/go-toolset
FROM registry.access.redhat.com/ubi8/go-toolset:1.15.14-3 as builder
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
    
# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/ubi-micro
FROM registry.access.redhat.com/ubi8/ubi-micro:8.4-84
COPY --from=builder /etc/passwd /etc/passwd
USER appuser
COPY --from=builder /app/configbump /usr/local/bin/configbump
ENTRYPOINT [ "/usr/local/bin/configbump" ]
