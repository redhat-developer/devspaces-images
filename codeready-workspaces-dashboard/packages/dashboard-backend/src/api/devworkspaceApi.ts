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
import {
  devworkspacePatchSchema,
  namespacedSchema,
  namespacedWorkspaceSchema,
  devworkspaceSchema,
} from '../constants/schemas';
import { getDevWorkspaceClient } from './helper';
import { restParams } from '../typings/models';
import { getSchema } from '../services/helpers';

const tags = ['devworkspace'];

export function registerDevworkspaceApi(server: FastifyInstance) {
  server.post(
    `${baseApiPath}/namespace/:namespace/devworkspaces`,
    getSchema({ tags, params: namespacedSchema, body: devworkspaceSchema }),
    async function (request: FastifyRequest) {
      const { devworkspace } = request.body as restParams.IDevWorkspaceSpecParam;
      const { namespace } = request.params as restParams.INamespacedParam;
      if (!devworkspace.metadata) {
        devworkspace.metadata = {};
      }
      if (!devworkspace.metadata.annotations) {
        devworkspace.metadata.annotations = {};
      }
      devworkspace.metadata.namespace = namespace;
      const { devworkspaceApi } = await getDevWorkspaceClient(request);
      return devworkspaceApi.create(devworkspace);
    },
  );

  server.patch(
    `${baseApiPath}/namespace/:namespace/devworkspaces/:workspaceName`,
    getSchema({ tags, params: namespacedWorkspaceSchema, body: devworkspacePatchSchema }),
    async function (request: FastifyRequest) {
      const { namespace, workspaceName } = request.params as restParams.INamespacedWorkspaceParam;
      const patch = request.body as { op: string; path: string; value?: any }[];
      const { devworkspaceApi } = await getDevWorkspaceClient(request);
      return devworkspaceApi.patch(namespace, workspaceName, patch);
    },
  );

  server.get(
    `${baseApiPath}/namespace/:namespace/devworkspaces`,
    getSchema({ tags, params: namespacedSchema }),
    async function (request: FastifyRequest) {
      const { namespace } = request.params as restParams.INamespacedParam;
      const { devworkspaceApi } = await getDevWorkspaceClient(request);
      return devworkspaceApi.listInNamespace(namespace);
    },
  );

  server.get(
    `${baseApiPath}/namespace/:namespace/devworkspaces/:workspaceName`,
    getSchema({ tags, params: namespacedWorkspaceSchema }),
    async function (request: FastifyRequest) {
      const { namespace, workspaceName } = request.params as restParams.INamespacedWorkspaceParam;
      const { devworkspaceApi } = await getDevWorkspaceClient(request);
      return devworkspaceApi.getByName(namespace, workspaceName);
    },
  );

  server.delete(
    `${baseApiPath}/namespace/:namespace/devworkspaces/:workspaceName`,
    getSchema({
      tags,
      params: namespacedWorkspaceSchema,
      response: {
        204: {
          description: 'The DevWorkspace is successfully marked for deletion',
          type: 'null',
        },
      },
    }),
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { namespace, workspaceName } = request.params as restParams.INamespacedWorkspaceParam;
      const { devworkspaceApi } = await getDevWorkspaceClient(request);
      await devworkspaceApi.delete(namespace, workspaceName);
      reply.code(204);
      return reply.send();
    },
  );
}
