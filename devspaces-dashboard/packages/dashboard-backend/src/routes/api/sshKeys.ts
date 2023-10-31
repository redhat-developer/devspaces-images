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

import { baseApiPath } from '@/constants/config';
import { namespacedSchema, sshKeyBodySchema, sshKeyParamsSchema } from '@/constants/schemas';
import { restParams } from '@/models';
import { getDevWorkspaceClient } from '@/routes/api/helpers/getDevWorkspaceClient';
import { getToken } from '@/routes/api/helpers/getToken';
import { getSchema } from '@/services/helpers';

const tags = ['SSH Keys'];

export function registerSShKeysRoutes(instance: FastifyInstance) {
  instance.register(async server => {
    server.get(
      `${baseApiPath}/namespace/:namespace/ssh-key`,
      getSchema({ tags, params: namespacedSchema }),
      async function (request: FastifyRequest) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const token = getToken(request);
        const { sshKeysApi } = getDevWorkspaceClient(token);

        return sshKeysApi.list(namespace);
      },
    );

    server.post(
      `${baseApiPath}/namespace/:namespace/ssh-key`,
      getSchema({ tags, params: namespacedSchema, body: sshKeyBodySchema }),
      async function (request: FastifyRequest) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const sskKey = request.body as api.SshKey;
        const token = getToken(request);
        const { sshKeysApi } = getDevWorkspaceClient(token);

        return sshKeysApi.add(namespace, sskKey);
      },
    );

    server.delete(
      `${baseApiPath}/namespace/:namespace/ssh-key/:name`,
      getSchema({ tags, params: sshKeyParamsSchema }),
      async function (request: FastifyRequest, reply: FastifyReply) {
        const { namespace, name } = request.params as restParams.ShhKeyNamespacedParams;

        const token = getToken(request);
        const { sshKeysApi } = getDevWorkspaceClient(token);

        await sshKeysApi.delete(namespace, name);
        return reply.code(204).send();
      },
    );
  });
}
