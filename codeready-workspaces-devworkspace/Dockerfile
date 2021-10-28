# Copyright (c) 2021 Red Hat, Inc.
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
FROM rhel8/go-toolset:1.15.14-3 as builder
ENV GOPATH=/go/
USER root
WORKDIR /workspace
# Copy the Go Modules manifests
COPY go.mod go.mod
COPY go.sum go.sum
# cache deps before building and copying source so that we don't need to re-download as much
# and so that source changes don't invalidate our downloaded layer
#RUN go mod download

# Copy the go source
COPY . .

# Build
RUN export ARCH="$(uname -m)" && if [[ ${ARCH} == "x86_64" ]]; then export ARCH="amd64"; elif [[ ${ARCH} == "aarch64" ]]; then export ARCH="arm64"; fi && \
  CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} GO111MODULE=on go build \
  -a -o _output/bin/devworkspace-che-operator \
  -gcflags all=-trimpath=/ \
  -asmflags all=-trimpath=/ \
  main.go

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM ubi8-minimal:8.4-208
RUN microdnf -y update && microdnf clean all && rm -rf /var/cache/yum && echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"
COPY --from=builder /workspace/_output/bin/devworkspace-che-operator /usr/local/bin/devworkspace-che-operator

ENV USER_UID=1001 \
    USER_NAME=devworkspace-che-operator

COPY build/bin /usr/local/bin
RUN /usr/local/bin/user_setup

USER ${USER_UID}

ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD /usr/local/bin/devworkspace-che-operator

# append Brew metadata here
ENV SUMMARY="Red Hat CodeReady Workspaces devworkspace container" \
    DESCRIPTION="Red Hat CodeReady Workspaces devworkspace container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="devworkspace-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.14" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
