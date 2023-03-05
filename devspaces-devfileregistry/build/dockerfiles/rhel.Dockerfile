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
# https://registry.access.redhat.com/ubi8/python-39
FROM registry.access.redhat.com/ubi8/python-39:1-97 as builder

# hadolint ignore=DL3002
USER root

# local hack to mock cachito dir
ENV REMOTE_SOURCES=REMOTE_SOURCES_DIR \
    REMOTE_SOURCES_DIR=/remote-source/
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

ENV PYTHON_VERSION=3.9

ARG BOOTSTRAP=true
ENV BOOTSTRAP=${BOOTSTRAP}

# if not defined or string is null, allow all registries/tags in list_referenced_images
# otherwise restrict to only those space-separated registries/tags; if others found, build will fail
# useful for failing build if quay images in an RC, or wrong devspaces image tag (3.2 in 3.1 build)
ARG ALLOWED_REGISTRIES=""
ENV ALLOWED_REGISTRIES=${ALLOWED_REGISTRIES}
ARG ALLOWED_TAGS=""
ENV ALLOWED_TAGS=${ALLOWED_TAGS}

# enable content sets to resolve jq as rpm
COPY ./build/dockerfiles/content_sets_rhel8.repo /etc/yum.repos.d/
# install yq and jq
# hadolint ignore=DL3003,DL4006,SC2086,DL3040,DL3041
RUN dnf -y -q install python39 python39-devel python39-setuptools python39-pip jq && \
# tree -L 2 "$REMOTE_SOURCES_DIR/*/app/" && \
    # cachito #2: install yq using cachito sources
    # cd $REMOTE_SOURCES_DIR/python-deps/app/devspaces-devfileregistry/build/python && \
    # source $REMOTE_SOURCES_DIR/python-deps/cachito.env && \
    python${PYTHON_VERSION} -m pip install --no-cache-dir --upgrade pip argcomplete setuptools yq && yq --version

WORKDIR /build/
COPY ./build/scripts ./versions.json ./job-config.json /build/
COPY ./devfiles /build/devfiles

RUN ls -la $REMOTE_SOURCES_DIR; ./generate_devworkspace_templates.sh && chmod -R g+rwX /build/resources

# validate devfile content
RUN ./check_referenced_images.sh devfiles --registries "${ALLOWED_REGISTRIES}" --tags "${ALLOWED_TAGS}" && \
    ./check_mandatory_fields.sh devfiles

# Cache projects in DS
COPY ./build/dockerfiles/rhel.cache_projects.sh /tmp/ 
RUN /tmp/rhel.cache_projects.sh /build/ && rm -rf /tmp/rhel.cache_projects.sh /tmp/resources.tgz && ./swap_yamlfiles.sh devfiles 

RUN ./index.sh > /build/devfiles/index.json && \
    ./list_referenced_images.sh devfiles > /build/devfiles/external_images.txt && \
    ./list_referenced_images_by_file.sh devfiles > /build/devfiles/external_images_by_devfile.txt && \
    chmod -R g+rwX /build/devfiles /build/resources

################# 
# PHASE TWO: configure registry image
################# 

# Build registry, copying meta.yamls and index.json from builder
# https://registry.access.redhat.com/ubi8/httpd-24
FROM registry.access.redhat.com/ubi8/httpd-24:1-240.1675799498 AS registry
# hadolint ignore=DL3002
USER 0

# latest httpd container doesn't include ssl cert, so generate one
# hadolint ignore=DL4006
RUN chmod +x /usr/share/container-scripts/httpd/pre-init/40-ssl-certs.sh && \
    /usr/share/container-scripts/httpd/pre-init/40-ssl-certs.sh && \
    yum -y -q update && \
    yum -y -q clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"

# hadolint ignore=SC2140
RUN echo "<FilesMatch "\""^\\.ht"\"">" >> /etc/httpd/conf/httpd.conf && \
    echo "Require all denied" >> /etc/httpd/conf/httpd.conf && \
    echo "</FilesMatch>" >> /etc/httpd/conf/httpd.conf

RUN sed -i /etc/httpd/conf.d/ssl.conf \
    -e "s,SSLProtocol all -SSLv2,SSLProtocol all -SSLv3," \
    -e "s,SSLCipherSuite HIGH:MEDIUM:!aNULL:!MD5,SSLCipherSuite HIGH:!aNULL:!MD5,"

RUN sed -i /etc/httpd/conf/httpd.conf \
    -e "s,Listen 80,Listen 8080," \
    -e "s,logs/error_log,/dev/stderr," \
    -e "s,logs/access_log,/dev/stdout," \
    -e "s,AllowOverride None,AllowOverride All," && \
    chmod a+rwX /etc/httpd/conf /run/httpd /etc/httpd/logs/
STOPSIGNAL SIGWINCH

ARG DS_BRANCH=devspaces-3-rhel-8
ENV DS_BRANCH=${DS_BRANCH}

WORKDIR /var/www/html

RUN mkdir -m 777 /var/www/html/devfiles
COPY README.md .htaccess /var/www/html/
COPY --from=builder /build/devfiles /var/www/html/devfiles
COPY --from=builder /build/resources /var/www/html/resources
COPY ./images /var/www/html/images
COPY ./build/dockerfiles/rhel.entrypoint.sh ./build/dockerfiles/entrypoint.sh /usr/local/bin/
RUN chmod g+rwX /usr/local/bin/entrypoint.sh /usr/local/bin/rhel.entrypoint.sh && \
    chgrp -R 0 /var/www/html && chmod -R g+rw /var/www/html
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/local/bin/rhel.entrypoint.sh"]

# Offline build
FROM builder AS offline-builder
RUN ./cache_projects.sh devfiles resources && \
    ./cache_images.sh devfiles resources && \
    chmod -R g+rwX /build

FROM registry AS offline-registry
COPY --from=offline-builder /build/devfiles /var/www/html/devfiles
COPY --from=offline-builder /build/resources /var/www/html/resources

# append Brew metadata here
