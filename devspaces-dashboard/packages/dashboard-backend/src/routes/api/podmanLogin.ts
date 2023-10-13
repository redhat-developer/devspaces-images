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

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { baseApiPath } from '@/constants/config';
import { namespacedKubeConfigSchema } from '@/constants/schemas';
import { restParams } from '@/models';
import { getDevWorkspaceClient } from '@/routes/api/helpers/getDevWorkspaceClient';
import { getToken } from '@/routes/api/helpers/getToken';
import { getSchema } from '@/services/helpers';

const tags = ['Podman Login'];

export function registerPodmanLoginRoute(instance: FastifyInstance) {
  instance.register(async server => {
    server.post(
      `${baseApiPath}/namespace/:namespace/devworkspaceId/:devworkspaceId/podmanlogin`,
      getSchema({
        tags,
        params: namespacedKubeConfigSchema,
        response: {
          204: {
            description:
              'The podman login command to the internal OpenShift registry has been successfully executed',
            type: 'null',
          },
        },
      }),
      async function (request: FastifyRequest, reply: FastifyReply) {
        const token = getToken(request);
        const { podmanApi } = getDevWorkspaceClient(token);
        const { namespace, devworkspaceId } = request.params as restParams.INamespacedPodParams;
        await podmanApi.podmanLogin(namespace, devworkspaceId);
        reply.code(204);
        return reply.send();
      },
    );
  });
}
