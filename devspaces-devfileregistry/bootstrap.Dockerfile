#
# Copyright (c) 2018-2023 Red Hat, Inc.
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
# https://registry.access.redhat.com/ubi8/python-38
FROM registry.access.redhat.com/ubi8/python-38:1-131 as builder
#FROM registry-proxy.engineering.redhat.com/ubi8/python-38:1 as builder
USER 0

ARG BOOTSTRAP=true
ENV BOOTSTRAP=${BOOTSTRAP}
# if not defined or string is null, allow all registries/tags in list_referenced_images
# otherwise restrict to only those space-separated registries/tags; if others found, build will fail
# useful for failing build if quay images in an RC, or wrong devspaces image tag (3.2 in 3.1 build)
ARG ALLOWED_REGISTRIES=""
ENV ALLOWED_REGISTRIES=${ALLOWED_REGISTRIES}
ARG ALLOWED_TAGS=""
ENV ALLOWED_TAGS=${ALLOWED_TAGS}

COPY ./build/dockerfiles/content_sets_rhel8.repo /etc/yum.repos.d/
COPY ./build/dockerfiles/rhel.install.sh /tmp
RUN /tmp/rhel.install.sh && rm -f /tmp/rhel.install.sh

COPY ./build/scripts ./versions.json /build/
COPY ./build/scripts/clone_and_zip.sh /build/build/scripts/
COPY ./VERSION /
COPY ./devfiles /build/devfiles
WORKDIR /build/

RUN ./generate_devworkspace_templates.sh
RUN chmod -R g+rwX /build/resources

# validate devfile content
RUN ./check_referenced_images.sh devfiles --registries "${ALLOWED_REGISTRIES}" --tags "${ALLOWED_TAGS}"
RUN ./check_mandatory_fields.sh devfiles

# Cache projects in DS 
COPY ./build/dockerfiles/rhel.cache_projects.sh /tmp/ 
RUN /tmp/rhel.cache_projects.sh /build/ && rm -rf /tmp/rhel.cache_projects.sh /tmp/resources.tgz 

# don't do swaps, or we end up with missing content if built on s390x or ppc64le worker
# RUN ./swap_yamlfiles.sh devfiles
# RUN ./swap_images.sh devfiles
RUN ./index.sh > /build/devfiles/index.json && \
    ./list_referenced_images.sh devfiles > /build/devfiles/external_images.txt && \
    ./list_referenced_images_by_file.sh devfiles > /build/devfiles/external_images_by_devfile.txt && \
    chmod -R g+rwX /build/devfiles

