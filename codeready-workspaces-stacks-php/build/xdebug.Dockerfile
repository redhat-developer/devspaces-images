# Copyright (c) 2018-2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/php-74
FROM registry.access.redhat.com/ubi8/php-74:1-28 as builder
USER root
RUN dnf install -y diffutils findutils php-fpm php-opcache php-devel php-pear php-gd php-mysqli php-zlib php-curl ca-certificates && \
    pecl channel-update pecl.php.net && \
    pecl install xdebug
RUN echo -e "zend_extension=$(find /usr/lib64/php/modules -name xdebug.so)\n\
xdebug.client_port = 9000\n\
xdebug.mode = debug\n\
xdebug.start_with_request = yes\n\
xdebug.remote_log=/tmp/xdebug.log" > /etc/php.ini
