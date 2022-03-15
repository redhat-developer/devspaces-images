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
import { dockerConfigSchema, namespacedDockerConfigSchema } from '../constants/schemas';
import { getDevWorkspaceClient, getToken } from './helper';
import { restParams } from '../typings/models';
import { getSchema } from '../services/helpers';

const tags = ['dockerconfig'];

export function registerDockerConfigApi(server: FastifyInstance) {
  server.put(
    `${baseApiPath}/namespace/:namespace/dockerconfig`,
    getSchema({ tags, params: namespacedDockerConfigSchema, body: dockerConfigSchema }),
    async function (request: FastifyRequest) {
      const { namespace } = request.params as restParams.INamespacedParam;
      const dockerCfg = request.body as restParams.IDockerConfigParams;
      const token = getToken(request);
      const { dockerConfigApi } = await getDevWorkspaceClient(token);

      return dockerConfigApi.update(namespace, dockerCfg);
    },
  );

  server.get(
    `${baseApiPath}/namespace/:namespace/dockerconfig`,
    getSchema({ tags, params: namespacedDockerConfigSchema }),
    async function (request: FastifyRequest) {
      const { namespace } = request.params as restParams.INamespacedParam;
      const token = getToken(request);
      const { dockerConfigApi } = await getDevWorkspaceClient(token);

      return dockerConfigApi.read(namespace);
    },
  );
}
