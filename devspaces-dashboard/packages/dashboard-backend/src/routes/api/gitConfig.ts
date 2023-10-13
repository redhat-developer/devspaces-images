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
import { FastifyInstance, FastifyRequest } from 'fastify';

import { baseApiPath } from '@/constants/config';
import { gitConfigSchema, namespacedSchema } from '@/constants/schemas';
import { restParams } from '@/models';
import { getDevWorkspaceClient } from '@/routes/api/helpers/getDevWorkspaceClient';
import { getToken } from '@/routes/api/helpers/getToken';
import { getSchema } from '@/services/helpers';

const tags = ['Gitconfig'];

export function registerGitConfigRoutes(instance: FastifyInstance) {
  instance.register(async server => {
    server.get(
      `${baseApiPath}/namespace/:namespace/gitconfig`,
      getSchema({ tags, params: namespacedSchema }),
      async function (request: FastifyRequest) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const token = getToken(request);
        const { gitConfigApi } = getDevWorkspaceClient(token);

        return gitConfigApi.read(namespace);
      },
    );

    server.patch(
      `${baseApiPath}/namespace/:namespace/gitconfig`,
      getSchema({ tags, params: namespacedSchema, body: gitConfigSchema }),
      async function (request: FastifyRequest) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const gitconfig = request.body as api.IGitConfig;
        const token = getToken(request);
        const { gitConfigApi } = getDevWorkspaceClient(token);

        return gitConfigApi.patch(namespace, gitconfig);
      },
    );
  });
}
