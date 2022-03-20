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

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/rhel8/go-toolset
FROM registry.redhat.io/rhel8/go-toolset:1.16.12-7 as builder
ENV GOPATH=/go/
ENV PATH=/usr/lib/golang/bin:$PATH
USER root
RUN adduser appuser
WORKDIR /app

ENV GO111MODULE on
# ENV GOPROXY https://goproxy.io # disable proxy so we don't try to use it in downstream
COPY . ./
RUN \
    export ARCH="$(uname -m)" && if [[ ${ARCH} == "x86_64" ]]; then export ARCH="amd64"; elif [[ ${ARCH} == "aarch64" ]]; then export ARCH="arm64"; fi && \
    go mod vendor && CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -mod=mod -a -ldflags '-w -s' -a -installsuffix cgo -o jwtproxy cmd/jwtproxy/main.go

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM registry.redhat.io/ubi8-minimal:8.5-240
RUN microdnf -y update || true && \
    microdnf -y clean all && rm -rf /var/cache/yum && echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"
USER appuser
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /app/jwtproxy /usr/local/bin/jwtproxy
ENTRYPOINT [ "/usr/local/bin/jwtproxy" ]

# The JWT proxy needs 2 things:
# * the location of the configuration file supplied as an argument:
#   `-config <location/of/the/config.yaml>`
# * The XDG_CONFIG_HOME environment variable pointing to a directory where to store auth keys
# CMD ["-config", "/che-jwtproxy-config/config.yaml"]

# append Brew metadata here
ENV SUMMARY="Red Hat CodeReady Workspaces jwtproxy container" \
    DESCRIPTION="Red Hat CodeReady Workspaces jwtproxy container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="jwtproxy-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.16" \
      license="EPLv2" \
      maintainer="Sergii Kabashniuk <skabashn@redhat.com>, Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
