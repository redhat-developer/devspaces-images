# Copyright (c) 2021-2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM docker.io/node:18.16.1-alpine3.18

ENV FRONTEND_LIB=../../packages/dashboard-frontend/lib/public
ENV BACKEND_LIB=../../packages/dashboard-backend/lib
ENV DEVFILE_REGISTRY=../../packages/devfile-registry

COPY ${BACKEND_LIB} /backend
COPY ${FRONTEND_LIB} /public
COPY ${DEVFILE_REGISTRY} /public/dashboard/devfile-registry

COPY ../../build/dockerfiles/entrypoint.sh /entrypoint.sh

EXPOSE 80
EXPOSE 443

ENTRYPOINT [ "/entrypoint.sh" ]
CMD [ "sh" ]
