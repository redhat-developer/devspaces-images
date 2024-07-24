# Copyright (c) 2021-2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

# https://registry.access.redhat.com/ubi8/nodejs-18
FROM registry.access.redhat.com/ubi8/nodejs-18:1-114.1720405264 as builder
# hadolint ignore=DL3002
USER 0
RUN dnf -y -q update --exclude=unbound-libs 

COPY . /dashboard/
WORKDIR /dashboard/
RUN npm i -g yarn; yarn install
RUN yarn build
RUN yarn workspace @eclipse-che/dashboard-backend install --production

# https://registry.access.redhat.com/ubi8/nodejs-18
FROM registry.access.redhat.com/ubi8/nodejs-18:1-114.1720405264
# hadolint ignore=DL3002
USER 0
# hadolint ignore=DL4006
RUN \
    yum -y -q update && \
    yum -y -q clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"

ENV FRONTEND_LIB=/dashboard/packages/dashboard-frontend/lib/public
ENV BACKEND_LIB=/dashboard/packages/dashboard-backend/lib
ENV BACKEND_NODE_MODULES=/dashboard/packages/dashboard-backend/node_modules/
ENV DEVFILE_REGISTRY=/dashboard/packages/devfile-registry

COPY --from=builder ${BACKEND_LIB} /backend
COPY --from=builder ${BACKEND_NODE_MODULES} /backend/node_modules
COPY --from=builder ${FRONTEND_LIB} /public
COPY --from=builder ${DEVFILE_REGISTRY} /public/dashboard/devfile-registry

COPY build/dockerfiles/rhel.entrypoint.sh /usr/local/bin
CMD ["/usr/local/bin/rhel.entrypoint.sh"]

## Append Brew metadata
