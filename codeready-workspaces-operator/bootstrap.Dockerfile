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

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/go-toolset
FROM registry.access.redhat.com/ubi8/go-toolset:1.15.13-4 as builder
ENV GOPATH=/go/
ENV RESTIC_TAG=v0.12.0
ARG DEV_WORKSPACE_CONTROLLER_VERSION="0.7.x"
ARG DEV_WORKSPACE_CHE_OPERATOR_VERSION="7.34.x"
ARG DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="v0.1.2"
USER root

# upstream, download zips for every build
# downstream, copy prefetched asset-*.zip into /tmp, and collect vendored sources for restic too
RUN mkdir -p $GOPATH/restic && \
    curl -sSLo- https://api.github.com/repos/restic/restic/tarball/${RESTIC_TAG} | tar --strip-components=1 -xz -C $GOPATH/restic && \
    cd $GOPATH/restic && go mod vendor

