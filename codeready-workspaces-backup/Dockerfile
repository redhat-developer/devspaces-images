# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/rhel8/go-toolset
FROM rhel8/go-toolset:1.15.14-14 as builder
ENV GOPATH=/tmp/go/

ENV REST_SERVER_TAG=v0.10.0
COPY asset* /tmp/
RUN export ARCH="$(uname -m)" && \
    if [[ ${ARCH} == "x86_64" ]]; then export ARCH="amd64"; \
    elif [[ ${ARCH} == "aarch64" ]]; then export ARCH="arm64"; \
    fi && \
    mkdir -p $GOPATH && cd $GOPATH && \
    tar -xzf /tmp/asset*.tgz --strip-components=2 -C $GOPATH && \
    cd rest-server && \
    GOOS=linux GOARCH=${ARCH} CGO_ENABLED=0 go build -mod=vendor -o rest-server ./cmd/rest-server

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM ubi8-minimal:8.4-210

COPY --from=builder /tmp/go/rest-server/rest-server /usr/local/bin/rest-server
COPY --from=builder /tmp/go/rest-server/LICENSE /usr/local/bin/rest-server-LICENSE.txt

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

ENV SUMMARY="Red Hat CodeReady Workspaces backup container" \
    DESCRIPTION="Red Hat CodeReady Workspaces backup container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="backup-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.14" \
      license="EPLv2" \
      maintainer="Mykola Morhun<mmorhun@redhat.com>, Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
