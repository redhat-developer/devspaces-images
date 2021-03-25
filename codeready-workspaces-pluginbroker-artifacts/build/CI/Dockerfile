#
# Copyright (c) 2018-2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

FROM golang:1.14
RUN wget -O- -nv https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s v1.30.0
RUN adduser --disabled-password --gecos '' appuser
USER appuser
COPY . /build/che-plugin-broker/
WORKDIR /build/che-plugin-broker/
RUN  CGO_ENABLED=0 GOOS=linux go build -mod vendor -a -ldflags '-w -s' -a -installsuffix cgo ./...
RUN golangci-lint run -v
RUN go test -v -race ./...
