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
import {
  dwTemplatePatchSchema,
  namespacedSchema,
  namespacedTemplateSchema,
  templateStartedSchema,
} from '@/constants/schemas';
import { isLocalRun } from '@/localRun';
import { restParams } from '@/models';
import { getDevWorkspaceClient } from '@/routes/api/helpers/getDevWorkspaceClient';
import { getToken } from '@/routes/api/helpers/getToken';
import { getSchema } from '@/services/helpers';

const tags = ['Devworkspace Template'];

export function registerDevWorkspaceTemplates(instance: FastifyInstance) {
  instance.register(async server => {
    server.get(
      `${baseApiPath}/namespace/:namespace/devworkspacetemplates`,
      getSchema({
        tags,
        params: namespacedSchema,
      }),
      async function (request: FastifyRequest) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const token = getToken(request);
        const { devWorkspaceTemplateApi: templateApi } = getDevWorkspaceClient(token);
        return templateApi.listInNamespace(namespace);
      },
    );

    server.post(
      `${baseApiPath}/namespace/:namespace/devworkspacetemplates`,
      getSchema({
        tags,
        params: namespacedSchema,
        body: templateStartedSchema,
      }),
      async function (request: FastifyRequest) {
        const { template } = request.body as restParams.ITemplateBodyParams;
        const { namespace } = request.params as restParams.INamespacedParams;
        if (!template.metadata) {
          template.metadata = {};
        }
        template.metadata.namespace = namespace;
        const token = getToken(request);
        const { devWorkspaceTemplateApi: templateApi } = getDevWorkspaceClient(token);
        return templateApi.create(template);
      },
    );

    server.patch(
      `${baseApiPath}/namespace/:namespace/devworkspacetemplates/:templateName`,
      getSchema({ tags, params: namespacedTemplateSchema, body: dwTemplatePatchSchema }),
      async function (request: FastifyRequest) {
        const { namespace, templateName } = request.params as restParams.INamespacedTemplateParams;
        const patch = request.body as { op: string; path: string; value?: any }[];
        const token = getToken(request);
        const { devWorkspaceTemplateApi: templateApi } = getDevWorkspaceClient(token);
        return templateApi.patch(namespace, templateName, patch);
      },
    );

    if (isLocalRun()) {
      server.delete(
        `${baseApiPath}/namespace/:namespace/devworkspacetemplates/:templateName`,
        getSchema({
          tags,
          params: namespacedTemplateSchema,
          response: {
            204: {
              description: 'The DevWorkspaceTemplate successfully deleted',
              type: 'null',
            },
          },
        }),
        async function (request: FastifyRequest, reply: FastifyReply) {
          const { namespace, templateName } =
            request.params as restParams.INamespacedTemplateParams;
          const token = getToken(request);
          const { devWorkspaceTemplateApi: templateApi } = getDevWorkspaceClient(token);
          await templateApi.delete(namespace, templateName);
          reply.code(204);
          return reply.send();
        },
      );
    }
  });
}
