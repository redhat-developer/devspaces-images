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
FROM registry.access.redhat.com/ubi8/nodejs-12:1-90 as builder
USER 0
RUN yum -y -q --nobest update && \
    yum -y -q clean all && rm -rf /var/cache/yum

COPY package.json /dashboard/
COPY yarn.lock /dashboard/
COPY .yarn/releases/yarn-*.cjs /dashboard/.yarn/releases/
COPY .yarn/plugins/@yarnpkg/plugin-*.cjs /dashboard/.yarn/plugins/@yarnpkg/
COPY .yarnrc.yml /dashboard/
COPY lerna.json /dashboard/

ENV FRONTEND=packages/dashboard-frontend
COPY ${FRONTEND}/package.json /dashboard/${FRONTEND}/

ENV BACKEND=packages/dashboard-backend
COPY ${BACKEND}/package.json /dashboard/${BACKEND}/

ENV STATIC_SERVER=packages/static-server
COPY ${STATIC_SERVER}/package.json /dashboard/${STATIC_SERVER}/

WORKDIR /dashboard
RUN /dashboard/.yarn/releases/yarn-*.cjs install --ignore-engines
COPY packages/ /dashboard/packages
RUN /dashboard/.yarn/releases/yarn-*.cjs build

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/httpd-24
FROM registry.access.redhat.com/ubi8/httpd-24:1-143 AS registry
USER 0

# latest httpd container doesn't include ssl cert, so generate one
RUN chmod +x /usr/share/container-scripts/httpd/pre-init/40-ssl-certs.sh && \
    /usr/share/container-scripts/httpd/pre-init/40-ssl-certs.sh
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
