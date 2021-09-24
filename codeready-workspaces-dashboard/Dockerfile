# Copyright (c) 2021     Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/nodejs-12
FROM ubi8/nodejs-12:1-98 as builder
USER 0
RUN yum -y -q --nobest update --exclude=unbound-libs && \
    yum -y -q clean all && rm -rf /var/cache/yum

COPY package.json /dashboard/
COPY yarn.lock /dashboard/
COPY .yarn/releases /dashboard/.yarn/releases/
COPY lerna.json /dashboard/

ENV FRONTEND=packages/dashboard-frontend
COPY ${FRONTEND}/package.json /dashboard/${FRONTEND}/

ENV BACKEND=packages/dashboard-backend
COPY ${BACKEND}/package.json /dashboard/${BACKEND}/

ENV STATIC_SERVER=packages/static-server
COPY ${STATIC_SERVER}/package.json /dashboard/${STATIC_SERVER}/

WORKDIR /dashboard
COPY asset-node-modules-cache.tgz /tmp/
RUN tar xzf /tmp/asset-node-modules-cache.tgz && rm -f /tmp/asset-node-modules-cache.tgz
COPY packages/ /dashboard/packages
RUN /dashboard/.yarn/releases/yarn-*.*js build

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/nodejs-12
FROM ubi8/nodejs-12:1-98
USER 0

RUN \
    yum -y -q --nobest update && \
    yum -y -q clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"

ENV FRONTEND_LIB=/dashboard/packages/dashboard-frontend/lib
ENV BACKEND_LIB=/dashboard/packages/dashboard-backend/lib
ENV STATIC_SERVER_LIB=/dashboard/packages/static-server/lib

COPY --from=builder ${STATIC_SERVER_LIB}/server.js /server.js
COPY --from=builder ${FRONTEND_LIB} /public

COPY build/dockerfiles/rhel.entrypoint.sh /usr/local/bin
CMD ["/usr/local/bin/rhel.entrypoint.sh"]

## Append Brew metadata
ENV SUMMARY="Red Hat CodeReady Workspaces dashboard container" \
    DESCRIPTION="Red Hat CodeReady Workspaces dashboard container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="dashboard-rhel8"
LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.12" \
      license="EPLv2" \
      maintainer="Josh Pinkney <jpinkney@redhat.com>, Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""
