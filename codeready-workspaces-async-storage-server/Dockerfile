# Copyright (c) 2020-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
# 

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM ubi8-minimal:8.5-204

# COPY content_sets_centos8.repo /etc/yum.repos.d/
COPY dockerfiles/server/entrypoint.sh /usr/local/bin
COPY dockerfiles/server/sshd_config /etc/ssh/sshd_config

RUN mkdir /etc/ssh /var/run/sshd /.ssh \
    && microdnf update -y \
    && microdnf install -y \
            rsync \
            openssh-server \
            ca-certificates \
            passwd \
    && touch /.ssh/known_hosts \
    && rm -rf /var/cache/yum /etc/ssh/ssh_host_rsa_key /etc/ssh/ssh_host_dsa_key \
    # Change permissions to let any arbitrary user
    && for f in  "/etc/ssh" "/etc/passwd" "/.ssh" "/var/run/sshd" ; do \
        echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
        chmod -R g+rwX ${f}; \
       done \
    && update-ca-trust \
    && chmod 0550 /.ssh \
    && chmod 0777 /.ssh/known_hosts \
    && sed -i s/root:!/"root:*"/g /etc/shadow \
    && chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 2222
ENTRYPOINT [ "/usr/local/bin/entrypoint.sh" ]
ENV SUMMARY="Red Hat CodeReady Workspaces async-storage-server container" \
    DESCRIPTION="Red Hat CodeReady Workspaces async-storage-server container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="async-storage-server-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.14" \
      license="EPLv2" \
      maintainer="Samantha Dawley<sdawley@redhat.com>, Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
