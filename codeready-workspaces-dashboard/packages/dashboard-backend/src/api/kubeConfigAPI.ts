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

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { baseApiPath } from '../constants/config';
import { getDevWorkspaceClient } from './helper';
import { getSchema } from '../services/helpers';
import { restParams } from '../typings/models';
import { namespacedKubeConfigSchema } from '../constants/schemas';

const tags = ['kubeconfig'];

export function registerKubeConfigApi(server: FastifyInstance) {
  server.post(
    `${baseApiPath}/namespace/:namespace/devworkspaceId/:devworkspaceId/kubeconfig`,
    getSchema({ tags, params: namespacedKubeConfigSchema }),
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { kubeConfigApi } = await getDevWorkspaceClient(request);
      const { namespace, devworkspaceId } = request.params as restParams.INamespacedPodParam;
      await kubeConfigApi.injectKubeConfig(namespace, devworkspaceId);
      reply.code(204);
      return reply.send();
    },
  );
}
