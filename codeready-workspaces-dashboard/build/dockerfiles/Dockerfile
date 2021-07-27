# Copyright (c) 2021     Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM docker.io/node:12.20.1-alpine3.12 as builder

RUN if ! [ type "yarn" &> /dev/null ]; then \
        apk add yarn --no-cache; \
    fi

COPY package.json /dashboard/
COPY yarn.lock /dashboard/
COPY lerna.json /dashboard/

ENV FRONTEND=packages/dashboard-frontend
COPY ${FRONTEND}/package.json /dashboard/${FRONTEND}/

ENV BACKEND=packages/dashboard-backend
COPY ${BACKEND}/package.json /dashboard/${BACKEND}/

ENV STATIC_SERVER=packages/static-server
COPY ${STATIC_SERVER}/package.json /dashboard/${STATIC_SERVER}/

WORKDIR /dashboard
RUN yarn install
COPY packages/ /dashboard/packages
RUN yarn build

FROM docker.io/node:12.20.1-alpine3.12

ENV FRONTEND_LIB=/dashboard/packages/dashboard-frontend/lib
ENV BACKEND_LIB=/dashboard/packages/dashboard-backend/lib
ENV STATIC_SERVER_LIB=/dashboard/packages/static-server/lib

COPY --from=builder ${STATIC_SERVER_LIB}/server.js /server.js
COPY --from=builder ${FRONTEND_LIB} /public

COPY build/dockerfiles/entrypoint.sh /entrypoint.sh

EXPOSE 80
EXPOSE 443

ENTRYPOINT [ "/entrypoint.sh" ]
CMD [ "sh" ]
