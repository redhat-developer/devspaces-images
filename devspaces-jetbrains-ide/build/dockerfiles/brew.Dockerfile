# Copyright (c) 2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# The Dockerfile works only in Brew, as it is customized for Cachito fetching
# project sources and npm dependencies, and performing an offline build with them

# The image to get the Node.js binary to support running an IDE in a UBI8-based user container.
# https://registry.access.redhat.com/ubi8/nodejs-20
FROM ubi8/nodejs-20:1-58.1724661482 as ubi8

# https://registry.access.redhat.com/rhel9-2-els/rhel
FROM registry.redhat.io/rhel9-2-els/rhel:9.2-1362

USER 0

WORKDIR $REMOTE_SOURCES_DIR/devspaces-images-jetbrains-ide/app/devspaces-jetbrains-ide/

# cachito:yarn step 1: copy cachito sources where we can use them; source env vars; set working dir
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

# hadolint ignore=SC2086
RUN source $REMOTE_SOURCES_DIR/devspaces-images-jetbrains-ide/cachito.env

RUN dnf module install -y nodejs:18/development

RUN cp -r build/scripts/*.sh /
RUN cp -r status-app /status-app/

# Create a folders structure for mounting a shared volume and copy the editor binaries to.
RUN mkdir -p /idea-server/status-app

# Adjust permissions on some items so they're writable by group root.
# hadolint ignore=SC2086
RUN for f in "${HOME}" "/etc/passwd" "/etc/group" "/status-app" "/idea-server"; do\
        chgrp -R 0 ${f} && \
        chmod -R g+rwX ${f}; \
    done

# Build the status app.
RUN cd $REMOTE_SOURCES_DIR/devspaces-images-jetbrains-ide/app/devspaces-jetbrains-ide/status-app/ && npm install

# to provide to a UBI8-based user's container
COPY --from=ubi8 /usr/bin/node /node-ubi8

# Switch to unprivileged user.
USER 1001

ENTRYPOINT /entrypoint.sh

ENV SUMMARY="Red Hat OpenShift Dev Spaces with JetBrains IDE container" \
    DESCRIPTION="Red Hat OpenShift Dev Spaces with JetBrains IDE container" \
    PRODNAME="devspaces" \
    COMPNAME="jetbrains-ide-rhel9"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="3.17" \
      license="EPLv2" \
      maintainer="Artem Zatsarynnyi <azatsary@redhat.com>, Samantha Dawley <sdawley@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
