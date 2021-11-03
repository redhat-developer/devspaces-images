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
#   IBM Corporation - implementation
#

# Builder: check meta.yamls and create index.json
# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/python-38
FROM registry-proxy.engineering.redhat.com/rh-osbs/ubi8-python-38:1-71.1634036286 as builder
USER 0

ARG BOOTSTRAP=true
ENV BOOTSTRAP=${BOOTSTRAP}

COPY ./build/dockerfiles/content_sets_rhel8.repo /etc/yum.repos.d/
COPY ./build/dockerfiles/rhel.install.sh /tmp
RUN /tmp/rhel.install.sh && rm -f /tmp/rhel.install.sh

COPY ./build/scripts ./arbitrary-users-patch/base_images /build/
COPY ./devfiles /build/devfiles
WORKDIR /build/

RUN ./check_mandatory_fields.sh devfiles
# Cache projects in CRW 
COPY ./build/dockerfiles/rhel.cache_projects.sh /tmp/ 
RUN /tmp/rhel.cache_projects.sh /build/ && rm -rf /tmp/rhel.cache_projects.sh /tmp/resources.tgz 

# don't do swaps, or we end up with missing content if built on s390x or ppc64le worker
# RUN ./swap_yamlfiles.sh devfiles
# RUN ./swap_images.sh devfiles
RUN ./index.sh > /build/devfiles/index.json
RUN ./list_referenced_images.sh devfiles > /build/devfiles/external_images.txt
RUN chmod -R g+rwX /build/devfiles

