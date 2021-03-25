# Copyright (c) 2019-2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/devtools/go-toolset-rhel7
FROM devtools/go-toolset-rhel7:1.14.12-4.1608220101 as builder
ENV PATH=/opt/rh/go-toolset-1.14/root/usr/bin:$PATH \
    GOPATH=/go/
USER root
WORKDIR /build/che-plugin-broker/brokers/metadata/cmd/
COPY . /build/che-plugin-broker/
RUN adduser appuser && \
    CGO_ENABLED=0 GOOS=linux go build -mod vendor -a -ldflags '-w -s' -installsuffix cgo -o metadata-broker main.go

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM ubi8-minimal:8.3-291

RUN microdnf update -y systemd && microdnf clean all && rm -rf /var/cache/yum && echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"

USER appuser
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /build/che-plugin-broker/brokers/metadata/cmd/metadata-broker /
ENTRYPOINT ["/metadata-broker"]

# append Brew metadata here
ENV SUMMARY="Red Hat CodeReady Workspaces pluginbroker-metadata container" \
DESCRIPTION="Red Hat CodeReady Workspaces pluginbroker-metadata container" \
PRODNAME="codeready-workspaces" \
COMPNAME="pluginbroker-metadata-rhel8" 
LABEL summary="$SUMMARY" \
description="$DESCRIPTION" \
io.k8s.description="$DESCRIPTION" \
io.k8s.display-name="$DESCRIPTION" \
io.openshift.tags="$PRODNAME,$COMPNAME" \
com.redhat.component="$PRODNAME-$COMPNAME-container" \
name="$PRODNAME/$COMPNAME" \
version="2.8" \
license="EPLv2" \
maintainer="Nick Boldt <nboldt@redhat.com>" \
io.openshift.expose-services="" \
usage="" 
