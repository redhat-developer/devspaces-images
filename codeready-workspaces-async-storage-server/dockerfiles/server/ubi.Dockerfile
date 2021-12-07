# Copyright (c) 2019-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
# 

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM registry.redhat.io/ubi8-minimal:8.5-204

ADD content_sets_centos8.repo /etc/yum.repos.d/
COPY  entrypoint.sh /usr/local/bin

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

COPY sshd_config /etc/ssh/sshd_config
EXPOSE 2222
ENTRYPOINT [ "/usr/local/bin/entrypoint.sh" ]
