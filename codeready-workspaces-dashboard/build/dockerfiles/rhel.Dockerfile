# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/nodejs-12
FROM registry.access.redhat.com/ubi8/nodejs-12:1-107 as builder
USER 0
RUN yum -y -q update && \
    yum -y -q clean all && rm -rf /var/cache/yum

COPY package.json /dashboard/
COPY yarn.lock /dashboard/
COPY .yarn/releases /dashboard/.yarn/releases/
COPY lerna.json /dashboard/
COPY tsconfig.json /dashboard/

ENV COMMON=packages/common
COPY ${COMMON}/package.json /dashboard/${COMMON}/

ENV FRONTEND=packages/dashboard-frontend
COPY ${FRONTEND}/package.json /dashboard/${FRONTEND}/

ENV BACKEND=packages/dashboard-backend
COPY ${BACKEND}/package.json /dashboard/${BACKEND}/

WORKDIR /dashboard
RUN /dashboard/.yarn/releases/yarn-*.*js install
COPY packages/ /dashboard/packages
RUN /dashboard/.yarn/releases/yarn-*.*js build

# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8/nodejs-12
FROM registry.access.redhat.com/ubi8/nodejs-12:1-107
USER 0

RUN \
    yum -y -q update && \
    yum -y -q clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"

ENV FRONTEND_LIB=/dashboard/packages/dashboard-frontend/lib
ENV BACKEND_LIB=/dashboard/packages/dashboard-backend/lib

COPY --from=builder ${BACKEND_LIB} /backend
COPY --from=builder ${FRONTEND_LIB} /public

COPY build/dockerfiles/rhel.entrypoint.sh /usr/local/bin
CMD ["/usr/local/bin/rhel.entrypoint.sh"]

## Append Brew metadata
