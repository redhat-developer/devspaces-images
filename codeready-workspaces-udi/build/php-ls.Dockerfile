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
RUN mkdir -p /php && cd /php && chmod -R 777 /php && \
    wget https://getcomposer.org/installer -O /tmp/composer-installer.php && \
    php /tmp/composer-installer.php --filename=composer --install-dir=/usr/local/bin
