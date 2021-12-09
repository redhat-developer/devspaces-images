# Copyright (c) 2020-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

FROM alpine:3.11

COPY entrypoint.sh /usr/local/bin
COPY sshd_config /etc/ssh/sshd_config

RUN mkdir /etc/ssh /var/run/sshd /.ssh \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
            rsync \
            openssh \
            ca-certificates \
    && touch /.ssh/known_hosts \
    && rm -rf /var/cache/apk/* /etc/ssh/ssh_host_rsa_key /etc/ssh/ssh_host_dsa_key \
    # Change permissions to let any arbitrary user
    && for f in  "/etc/ssh" "/etc/passwd" "/.ssh" "/var/run/sshd" ; do \
        echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
        chmod -R g+rwX ${f}; \
       done \
    && update-ca-certificates \
    && chmod 0550 /.ssh \
    && chmod 0777 /.ssh/known_hosts \
    && sed -i s/root:!/"root:*"/g /etc/shadow \
    && chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 2222
ENTRYPOINT [ "/usr/local/bin/entrypoint.sh" ]
