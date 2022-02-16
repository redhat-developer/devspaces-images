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

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/go-toolset
FROM registry.access.redhat.com/ubi8/go-toolset:1.16.12-4 as builder
ENV GOPATH=/go/
ENV RESTIC_TAG=v0.12.0
USER root

RUN mkdir -p $GOPATH/restic && \
    curl -sSLo- https://api.github.com/repos/restic/restic/tarball/${RESTIC_TAG} | tar --strip-components=1 -xz -C $GOPATH/restic && \
    cd $GOPATH/restic && go mod vendor

