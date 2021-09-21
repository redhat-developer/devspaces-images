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
import { namespacedSchema } from '../constants/schemas';
import { getDevWorkspaceClient } from './helper';
import { getSchema } from '../services/helpers';
import { restParams } from '../typings/models';

const tags = ['namespace'];

export function registerCheApi(server: FastifyInstance) {
  server.get(
    `${baseApiPath}/namespace/:namespace/init`,
    getSchema({ tags,
      params: namespacedSchema,
      response: {
        204: {
          description: 'DevWorkspaces target namespace is initialized',
          type: 'null'
        }
      }
    }),
    async  function (request: FastifyRequest, reply: FastifyReply) {
      const {namespace} = request.params as restParams.INamespacedParam;
      const {cheApi} = await getDevWorkspaceClient(request);
      await cheApi.initializeNamespace(namespace);
      reply.code(204);
      return reply.send();
    }
  );
}
