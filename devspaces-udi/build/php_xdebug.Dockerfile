# Copyright (c) 2022 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#
# this dockerfile is not part of the UDI image build, but can be used to build only the php+xdebug part of the UDI image locally, 
# to facilitate testing before using Cachito sources in OSBS

FROM ubi8-minimal:latest

USER root
ENV \
    HOME=/home/user \
    PHP_VERSION="8.0" \
    XDEBUG_VERSION="3.1.6"

RUN \
    microdnf install -y dnf bash tar gzip unzip bzip2 which shadow-utils findutils wget curl sudo git git-lfs procps-ng 
RUN \
    dnf -y -q module enable php:$PHP_VERSION && \
    dnf -y -q install php php-fpm php-opcache php-devel php-pear php-gd php-mysqli php-zlib php-curl ca-certificates make

# COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR
ENV REMOTE_SOURCES_DIR=/tmp/
RUN cd $REMOTE_SOURCES_DIR; curl -sSLkO https://github.com/xdebug/xdebug/archive/refs/tags/${XDEBUG_VERSION}.tar.gz && \
    tar xvzf ${XDEBUG_VERSION}.tar.gz && mv xdebug-${XDEBUG_VERSION} xdebug

RUN \
    # compile xdebug
    cd $REMOTE_SOURCES_DIR/xdebug && \
    # ls -la . && \
    # According to https://xdebug.org/docs/faq#api, must have the same value from php -i | grep "Zend Extension Build" and phpize | grep "Extension Api"
    # Zend Extension Build => API320180731,NTS
    # Zend Extension Api No:   320180731
    php -i | grep "Zend Extension Build" && phpize | grep "Extension Api" && \
    ./configure --enable-xdebug && make && make install && \
    # do we need all these settings? or just the zend_extension?
    echo -e "zend_extension=$(find /usr/lib64/php/modules -name xdebug.so)\n\
xdebug.client_port = 9000\n\
xdebug.mode = debug\n\
xdebug.start_with_request = yes\n\
xdebug.log=/tmp/xdebug.log" > /etc/php.ini && \
    # set up httpd
    sed -i 's/opt\/app-root\/src/projects/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/#DocumentRoot/DocumentRoot/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/CustomLog \"|\/usr\/bin\/cat\"/CustomLog \"\/var\/log\/httpd\/access_log\"/' /etc/httpd/conf/httpd.conf && \
    sed -i 's/ErrorLog \"|\/usr\/bin\/cat\"/ErrorLog \"\/var\/log\/httpd\/error_log\"/' /etc/httpd/conf/httpd.conf && \
    chmod -R 777 /var/run/httpd /var/log/httpd/ /etc/pki/ /etc/httpd/logs/ && \
    # verify xdebug works
    php --ini; echo "<?php xdebug_info() ?>" | php; php -v
