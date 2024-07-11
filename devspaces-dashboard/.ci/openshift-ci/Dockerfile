#!/bin/bash
#
# Copyright (c) 2012-2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Note: if we used a UBI image we could keep this current with
# https://github.com/eclipse-che/che-release/blob/main/.github/workflows/update-base-images.yml
FROM registry.ci.openshift.org/openshift/release:golang-1.20

SHELL ["/bin/bash", "-c"]

# Temporary workaround since mirror.centos.org is down and can be replaced with vault.centos.org
RUN sed -i s/mirror.centos.org/vault.centos.org/g /etc/yum.repos.d/*.repo && \
    sed -i s/^#.*baseurl=http/baseurl=http/g /etc/yum.repos.d/*.repo && \
    sed -i s/^mirrorlist=http/#mirrorlist=http/g /etc/yum.repos.d/*.repo


# Install yq, kubectl, chectl cli.
RUN yum install --assumeyes -d1 python3-pip  httpd-tools nodejs && \
    pip3 install --upgrade setuptools && \
    pip3 install yq && \
    curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin && \
    bash <(curl -sL https://che-incubator.github.io/chectl/install.sh) --channel=next
