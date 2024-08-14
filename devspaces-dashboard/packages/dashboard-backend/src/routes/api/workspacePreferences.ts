/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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
import {
  namespacedSchema,
  namespacedWorkspacePreferencesAuthorizationSchema,
  namespacedWorkspacePreferencesTrustedSourceSchema,
} from '@/constants/schemas';
import { restParams } from '@/models';
import { getDevWorkspaceClient } from '@/routes/api/helpers/getDevWorkspaceClient';
import { getToken } from '@/routes/api/helpers/getToken';
import { getSchema } from '@/services/helpers';

const tags = ['WorkspacePreferences'];

export function registerWorkspacePreferencesRoute(instance: FastifyInstance) {
  instance.register(async server => {
    server.get(
      `${baseApiPath}/workspace-preferences/namespace/:namespace`,
      getSchema({ tags, params: namespacedSchema }),
      async function (request: FastifyRequest) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const token = getToken(request);
        const { workspacePreferencesApi: devWorkspacePreferencesApi } =
          getDevWorkspaceClient(token);
        return devWorkspacePreferencesApi.getWorkspacePreferences(namespace);
      },
    );

    server.delete(
      `${baseApiPath}/workspace-preferences/namespace/:namespace/skip-authorisation/:provider`,
      getSchema({
        tags,
        params: namespacedWorkspacePreferencesAuthorizationSchema,
        response: {
          204: {
            description: 'The Provider is successfully removed from skip-authorisation list',
            type: 'null',
          },
        },
      }),
      async function (request: FastifyRequest, reply: FastifyReply) {
        const { namespace, provider } = request.params as restParams.IWorkspacePreferencesParams;
        const token = getToken(request);
        const { workspacePreferencesApi: devWorkspacePreferencesApi } =
          getDevWorkspaceClient(token);

        await devWorkspacePreferencesApi.removeProviderFromSkipAuthorizationList(
          namespace,
          provider,
        );

        reply.code(204).send();
      },
    );

    server.post(
      `${baseApiPath}/workspace-preferences/namespace/:namespace/trusted-source`,
      getSchema({
        tags,
        params: namespacedSchema,
        body: namespacedWorkspacePreferencesTrustedSourceSchema,
      }),
      async function (request: FastifyRequest, reply: FastifyReply) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const body = request.body as { source: api.TrustedSourceAll | api.TrustedSourceUrl };
        const token = getToken(request);
        const { workspacePreferencesApi: devWorkspacePreferencesApi } =
          getDevWorkspaceClient(token);

        await devWorkspacePreferencesApi.addTrustedSource(namespace, body.source);

        reply.code(204).send();
      },
    );

    server.delete(
      `${baseApiPath}/workspace-preferences/namespace/:namespace/trusted-source`,
      getSchema({ tags, params: namespacedSchema }),
      async function (request: FastifyRequest, reply: FastifyReply) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const token = getToken(request);
        const { workspacePreferencesApi: devWorkspacePreferencesApi } =
          getDevWorkspaceClient(token);

        await devWorkspacePreferencesApi.removeTrustedSources(namespace);

        reply.code(204).send();
      },
    );
  });
}
