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
FROM registry.access.redhat.com/ubi8/go-toolset:1.16.12-7 as builder
ENV GOPATH=/go/
ARG DEV_WORKSPACE_CONTROLLER_VERSION="v0.13.0"
ARG DEV_HEADER_REWRITE_TRAEFIK_PLUGIN="v0.1.2"
ARG TESTS="true"
USER root


