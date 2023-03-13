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
import { baseApiPath } from '../../constants/config';
import {
  devworkspacePatchSchema,
  namespacedSchema,
  namespacedWorkspaceSchema,
  devworkspaceSchema,
} from '../../constants/schemas';
import { getDevWorkspaceClient } from './helpers/getDevWorkspaceClient';
import { getToken } from './helpers/getToken';
import { restParams } from '../../typings/models';
import { getSchema } from '../../services/helpers';
import { api } from '@eclipse-che/common';

const tags = ['Devworkspace'];

export function registerDevworkspacesRoutes(server: FastifyInstance) {
  server.get(
    `${baseApiPath}/namespace/:namespace/devworkspaces`,
    getSchema({ tags, params: namespacedSchema }),
    async function (request: FastifyRequest) {
      const { namespace } = request.params as restParams.INamespacedParams;
      const token = getToken(request);
      const { devworkspaceApi } = getDevWorkspaceClient(token);
      return await devworkspaceApi.listInNamespace(namespace);
    },
  );

  server.post(
    `${baseApiPath}/namespace/:namespace/devworkspaces`,
    getSchema({ tags, params: namespacedSchema, body: devworkspaceSchema }),
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { devworkspace } = request.body as restParams.IDevWorkspaceSpecParams;
      const { namespace } = request.params as restParams.INamespacedParams;
      if (!devworkspace.metadata) {
        devworkspace.metadata = {};
      }
      if (!devworkspace.metadata.annotations) {
        devworkspace.metadata.annotations = {};
      }
      devworkspace.metadata.namespace = namespace;
      const token = getToken(request);
      const { devworkspaceApi } = getDevWorkspaceClient(token);
      const { headers, devWorkspace } = await devworkspaceApi.create(devworkspace, namespace);

      reply.headers(headers);
      reply.send(devWorkspace);
    },
  );

  server.get(
    `${baseApiPath}/namespace/:namespace/devworkspaces/:workspaceName`,
    getSchema({ tags, params: namespacedWorkspaceSchema }),
    async function (request: FastifyRequest) {
      const { namespace, workspaceName } = request.params as restParams.INamespacedWorkspaceParams;
      const token = getToken(request);
      const { devworkspaceApi } = getDevWorkspaceClient(token);
      return devworkspaceApi.getByName(namespace, workspaceName);
    },
  );

  server.patch(
    `${baseApiPath}/namespace/:namespace/devworkspaces/:workspaceName`,
    getSchema({ tags, params: namespacedWorkspaceSchema, body: devworkspacePatchSchema }),
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { namespace, workspaceName } = request.params as restParams.INamespacedWorkspaceParams;
      const patch = request.body as api.IPatch[];
      const token = getToken(request);
      const { devworkspaceApi } = getDevWorkspaceClient(token);
      const { headers, devWorkspace } = await devworkspaceApi.patch(
        namespace,
        workspaceName,
        patch,
      );

      reply.headers(headers);
      reply.send(devWorkspace);
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
      const { namespace, workspaceName } = request.params as restParams.INamespacedWorkspaceParams;
      const token = getToken(request);
      const { devworkspaceApi } = getDevWorkspaceClient(token);
      await devworkspaceApi.delete(namespace, workspaceName);
      reply.code(204);
      return reply.send();
    },
  );
}
