#
# Copyright (c) 2018-2021 Red Hat, Inc.
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
FROM rhel8/go-toolset:1.16.7-5 as builder
USER root
WORKDIR /build/che-plugin-broker/brokers/artifacts/cmd/
COPY . /build/che-plugin-broker/
RUN adduser appuser && \
    CGO_ENABLED=0 GOOS=linux go build -mod vendor -a -ldflags '-w -s' -installsuffix cgo -o artifacts-broker main.go

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM ubi8-minimal:8.5-204
USER appuser
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /build/che-plugin-broker/brokers/artifacts/cmd/artifacts-broker /
ENTRYPOINT ["/artifacts-broker"]
ENV SUMMARY="Red Hat CodeReady Workspaces pluginbroker-artifacts container" \
    DESCRIPTION="Red Hat CodeReady Workspaces pluginbroker-artifacts container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="pluginbroker-artifacts-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.14" \
      license="EPLv2" \
      maintainer="Angel Misevski <amisevsk@redhat.com>, Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
