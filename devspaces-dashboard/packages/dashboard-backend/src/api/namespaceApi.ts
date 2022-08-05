/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { baseApiPath } from '../constants/config';
import { getDevWorkspaceClient, getServiceAccountToken, getToken } from './helper';
import { getSchema } from '../services/helpers';

const tags = ['Namespace'];

export function namespaceApi(server: FastifyInstance) {
  server.get(
    `${baseApiPath}/namespaces`,
    getSchema({ tags }),
    async function (request: FastifyRequest) {
      const userToken = getToken(request);
      const serviceAccountToken = await getServiceAccountToken();
      const { namespaceApi } = await getDevWorkspaceClient(serviceAccountToken);
      return namespaceApi.getNamespaces(userToken);
    },
  );
}
