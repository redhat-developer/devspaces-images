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

# ovsx.Dockerfile is used to build the ovsx npm package and its dependencies using yarn
# The result is a node_modules directory that can be copied to the final image
# The directory is located at /tmp/opt/ovsx/node_modules

# https://registry.access.redhat.com/ubi8/nodejs-18
FROM registry.access.redhat.com/ubi8/nodejs-18:1-114 as builder

# hadolint ignore=DL3002
USER root

WORKDIR $REMOTE_SOURCES_DIR/devspaces-pluginregistry/app/devspaces-pluginregistry 
ENV NPM_CONFIG_NODEDIR=/usr

# cachito:yarn step 1: copy cachito sources where we can use them;
COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

# hadolint ignore=SC2086
RUN source $REMOTE_SOURCES_DIR/devspaces-pluginregistry/cachito.env; \
       cat $REMOTE_SOURCES_DIR/devspaces-pluginregistry/cachito.env 

# cachito:yarn step 2: workaround for yarn not being installed in an executable path, taking yarn from the dashboard part
# hadolint ignore=SC2086
RUN ln -s $REMOTE_SOURCES_DIR/devspaces-pluginregistry/app/devspaces-dashboard/.yarn/releases/yarn-*.js /usr/local/bin/yarn

# cachito:yarn step 3: install ovsx dependencies using yarn
# put the node_modules of ovsx npm library into /tmp/opt/ovsx location so we can copy them to the final image
RUN cd $REMOTE_SOURCES_DIR/devspaces-pluginregistry/app/devspaces-pluginregistry/cachito/ovsx \
 && yarn \
 && mkdir -p /tmp/opt/ovsx && cp -r $REMOTE_SOURCES_DIR/devspaces-pluginregistry/app/devspaces-pluginregistry/cachito/ovsx/node_modules/. /tmp/opt/ovsx/node_modules \
 && echo "OVSX version:" \
 && /tmp/opt/ovsx/node_modules/.bin/ovsx --version

