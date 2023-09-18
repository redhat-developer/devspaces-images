#
# Copyright (c) 2012-2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# Note: if we used a UBI image we could keep this current with
# https://github.com/eclipse-che/che-release/blob/main/.github/workflows/update-base-images.yml
FROM docker.io/golang:1.18-alpine as builder

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

RUN apk --update --no-cache add \
    build-base \
    gcc \
    git \
  && rm -rf /tmp/* /var/cache/apk/*
RUN adduser -D -g '' appuser
WORKDIR /app

ENV GO111MODULE on
ENV GOPROXY https://goproxy.io
# to test FIPS compliance, run https://github.com/openshift/check-payload#scan-a-container-or-operator-image against a built image
ENV CGO_ENABLED=1
COPY go.mod .
COPY go.sum .
RUN go mod download
COPY . ./

ARG VERSION=dev
RUN GOOS=linux go build -a -ldflags '-w -s' -a -installsuffix cgo -o configbump cmd/configbump/main.go

FROM docker.io/alpine:3.18

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL maintainer="Eclipse Che team" \
  org.opencontainers.image.created=$BUILD_DATE \
  org.opencontainers.image.url="https://github.com/che-incubator/configbump" \
  org.opencontainers.image.source="https://github.com/che-incubator/configbump" \
  org.opencontainers.image.version=$VERSION \
  org.opencontainers.image.revision=$VCS_REF \
  org.opencontainers.image.vendor="Eclipse Che team" \
  org.opencontainers.image.title="ConfigBump" \
  org.opencontainers.image.description="This is a simple Kubernetes controller that is able to quickly synchronize a set of configmaps (selected using labels) to files on local filesystem." \
  org.opencontainers.image.licenses="EPL 2.0"

ENV EDITION_IDS="ConfigBump"

RUN apk --update --no-cache add \
    ca-certificates \
    libressl \
    tzdata \
  && rm -rf /tmp/* /var/cache/apk/* 

USER appuser
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /app/configbump /usr/local/bin/configbump
ENTRYPOINT [ "/usr/local/bin/configbump" ]
