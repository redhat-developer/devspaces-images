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

import { FastifyInstance, FastifyRequest } from 'fastify';

import { baseApiPath } from '@/constants/config';
import { dockerConfigSchema, namespacedSchema } from '@/constants/schemas';
import { restParams } from '@/models';
import { getDevWorkspaceClient } from '@/routes/api/helpers/getDevWorkspaceClient';
import { getToken } from '@/routes/api/helpers/getToken';
import { getSchema } from '@/services/helpers';

const tags = ['Docker Config'];

export function registerDockerConfigRoutes(instance: FastifyInstance) {
  instance.register(async server => {
    server.get(
      `${baseApiPath}/namespace/:namespace/dockerconfig`,
      getSchema({ tags, params: namespacedSchema }),
      async function (request: FastifyRequest) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const token = getToken(request);
        const { dockerConfigApi } = getDevWorkspaceClient(token);

        return dockerConfigApi.read(namespace);
      },
    );

    server.put(
      `${baseApiPath}/namespace/:namespace/dockerconfig`,
      getSchema({ tags, params: namespacedSchema, body: dockerConfigSchema }),
      async function (request: FastifyRequest) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const dockerCfg = request.body as restParams.IDockerConfigParams;
        const token = getToken(request);
        const { dockerConfigApi } = getDevWorkspaceClient(token);

        return dockerConfigApi.update(namespace, dockerCfg);
      },
    );
  });
}
