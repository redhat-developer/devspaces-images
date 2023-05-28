/*
 * Copyright (c) 2018-2023 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { api } from '@eclipse-che/common';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { baseApiPath } from '../../constants/config';
import {
  namespacedSchema,
  personalAccessTokenBodySchema,
  personalAccessTokenParamsSchema,
} from '../../constants/schemas';
import { restParams } from '../../models';
import { getSchema } from '../../services/helpers';
import { getDevWorkspaceClient } from './helpers/getDevWorkspaceClient';
import { getToken } from './helpers/getToken';

const tags = ['Personal Access Token'];

export function registerPersonalAccessTokenRoutes(server: FastifyInstance) {
  server.get(
    `${baseApiPath}/namespace/:namespace/personal-access-token`,
    getSchema({ tags, params: namespacedSchema }),
    async function (request: FastifyRequest) {
      const { namespace } = request.params as restParams.INamespacedParams;
      const token = getToken(request);
      const { personalAccessTokenApi } = getDevWorkspaceClient(token);

      return personalAccessTokenApi.listInNamespace(namespace);
    },
  );

  server.post(
    `${baseApiPath}/namespace/:namespace/personal-access-token`,
    getSchema({ tags, params: namespacedSchema, body: personalAccessTokenBodySchema }),
    async function (request: FastifyRequest) {
      const { namespace } = request.params as restParams.INamespacedParams;
      const personalAccessToken = request.body as api.PersonalAccessToken;
      const token = getToken(request);
      const { personalAccessTokenApi } = getDevWorkspaceClient(token);

      return personalAccessTokenApi.create(namespace, personalAccessToken);
    },
  );

  server.patch(
    `${baseApiPath}/namespace/:namespace/personal-access-token`,
    getSchema({ tags, params: namespacedSchema, body: personalAccessTokenBodySchema }),
    async function (request: FastifyRequest) {
      const { namespace } = request.params as restParams.INamespacedParams;
      const personalAccessToken = request.body as api.PersonalAccessToken;
      const token = getToken(request);
      const { personalAccessTokenApi } = getDevWorkspaceClient(token);

      return personalAccessTokenApi.replace(namespace, personalAccessToken);
    },
  );

  server.delete(
    `${baseApiPath}/namespace/:namespace/personal-access-token/:tokenName`,
    getSchema({ tags, params: personalAccessTokenParamsSchema }),
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { namespace, tokenName } =
        request.params as restParams.PersonalAccessTokenNamespacedParams;

      const token = getToken(request);
      const { personalAccessTokenApi } = getDevWorkspaceClient(token);

      await personalAccessTokenApi.delete(namespace, tokenName);
      return reply.code(204).send();
    },
  );
}
