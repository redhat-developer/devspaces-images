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

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/python-38
FROM registry-proxy.engineering.redhat.com/rh-osbs/ubi8-python-38:1-63.1626843762 as builder
USER 0

# Keep old BOOTSTRAP variable as the rhel.install script still checks them
ARG BOOTSTRAP=true
ENV BOOTSTRAP=${BOOTSTRAP}

# Install deps
COPY ./build/dockerfiles/content_sets_rhel8.repo /etc/yum.repos.d/
COPY ./build/dockerfiles/rhel.install.sh /tmp
RUN /tmp/rhel.install.sh && rm -f /tmp/rhel.install.sh
RUN npm install --global yarn

# Copy files needed for the plugin registry build/artifact creation
COPY ./build.sh ./*.yml ./*.yaml ./*.js ./*.json ./yarn.lock /build/
COPY ./build /build/build/

# Run plugin registry build to generate artifacts
WORKDIR /build/
RUN SKIP_FORMAT=true SKIP_LINT=true SKIP_TEST=true ./build.sh --offline --skip-oci-image

# Archive artifacts to be copied out by Jenkins
RUN tar -czvf resources.tgz ./output/v3/ && mkdir /tmp/resources/ && cp ./resources.tgz /tmp/resources/
