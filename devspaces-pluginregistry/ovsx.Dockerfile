#
# Copyright (c) 2024 Red Hat, Inc.
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

# ovsx.Dockerfile is used to build the ovsx npm package and its dependencies using npm
# The result is a node_modules directory that can be copied to the final image
# The directory is located at /tmp/opt/ovsx/node_modules

# https://registry.access.redhat.com/rhel9-2-els/rhel
FROM registry.redhat.io/rhel9-2-els/rhel:9.2-1327 as builder

# hadolint ignore=DL3002
USER root

RUN dnf install -y make
RUN dnf module install -y nodejs:18/development

WORKDIR $REMOTE_SOURCES_DIR/devspaces-pluginregistry/app/devspaces-pluginregistry 
ENV NPM_CONFIG_NODEDIR=/usr

COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

# hadolint ignore=SC2086
RUN source $REMOTE_SOURCES_DIR/devspaces-pluginregistry/cachito.env; \
       cat $REMOTE_SOURCES_DIR/devspaces-pluginregistry/cachito.env 

# put the node_modules of ovsx npm library into /tmp/opt/ovsx location so we can copy them to the final image
RUN cd $REMOTE_SOURCES_DIR/devspaces-pluginregistry/app/devspaces-pluginregistry/cachito/ovsx \
 && npm install \
 && mkdir -p /tmp/opt/ovsx && cp -r $REMOTE_SOURCES_DIR/devspaces-pluginregistry/app/devspaces-pluginregistry/cachito/ovsx/node_modules/. /tmp/opt/ovsx/node_modules \
 && echo "npm version:" \
 && npm --version \
 && echo "OVSX version:" \
 && /tmp/opt/ovsx/node_modules/.bin/ovsx --version

