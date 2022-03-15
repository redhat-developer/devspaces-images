#
# Copyright (c) 2012-2018 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

FROM --platform=${BUILDPLATFORM:-linux/amd64} golang:1.13-alpine3.12 as builder

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN printf "I am running on ${BUILDPLATFORM:-linux/amd64}, building for ${TARGETPLATFORM:-linux/amd64}\n$(uname -a)\n" \
  && $(case ${TARGETPLATFORM:-linux/amd64} in \
      "linux/amd64")   echo "GOOS=linux GOARCH=amd64" > /tmp/.env                       ;; \
      "linux/arm64")   echo "GOOS=linux GOARCH=arm64" > /tmp/.env                       ;; \
      "linux/ppc64le") echo "GOOS=linux GOARCH=ppc64le" > /tmp/.env                     ;; \
      "linux/s390x")   echo "GOOS=linux GOARCH=s390x" > /tmp/.env                       ;; \
      *)               echo "TARGETPLATFORM ${TARGETPLATFORM} not found..." && exit 1   ;; \
    esac) \
  && cat /tmp/.env
RUN env $(cat /tmp/.env | xargs) go env

RUN apk --update --no-cache add \
    build-base \
    gcc \
    git \
  && rm -rf /tmp/* /var/cache/apk/*
RUN adduser -D -g '' appuser
WORKDIR /app

ENV GO111MODULE on
ENV GOPROXY https://goproxy.io
COPY go.mod .
COPY go.sum .
RUN env $(cat /tmp/.env | xargs) go mod download
COPY . ./

ARG VERSION=dev
RUN env $(cat /tmp/.env | xargs) go build -a -ldflags '-w -s' -a -installsuffix cgo -o configbump cmd/configbump/main.go

FROM --platform=${TARGETPLATFORM:-linux/amd64} alpine:3.12

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
