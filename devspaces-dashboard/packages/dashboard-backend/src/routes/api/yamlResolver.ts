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

import { helpers } from '@eclipse-che/common';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fetch from 'node-fetch';

import { baseApiPath } from '@/constants/config';
import { namespacedSchema, yamlResolverSchema } from '@/constants/schemas';
import { restParams } from '@/models';
import { getDevWorkspaceClient } from '@/routes/api/helpers/getDevWorkspaceClient';
import { getToken } from '@/routes/api/helpers/getToken';
import { getSchema } from '@/services/helpers';

const tags = ['Yaml Resolver'];

export function registerYamlResolverRoute(instance: FastifyInstance) {
  instance.register(async server => {
    server.post(
      `${baseApiPath}/namespace/:namespace/yaml/resolver`,
      getSchema({ tags, params: namespacedSchema, body: yamlResolverSchema }),
      async function (request: FastifyRequest, reply: FastifyReply): Promise<string | void> {
        const { url } = request.body as restParams.IYamlResolverParams;
        const { namespace } = request.params as restParams.INamespacedParams;
        const token = getToken(request);
        const { dockerConfigApi } = getDevWorkspaceClient(token);

        try {
          // check user permissions
          await dockerConfigApi.read(namespace);
        } catch (e) {
          throw new Error(`User permissions error. ${helpers.errors.getMessage(e)}`);
        }

        const response = await fetch(url);
        if (response.ok) {
          return response.text();
        } else {
          reply.code(response.status);
          reply.send(response.body);
          return reply;
        }
      },
    );
  });
}
