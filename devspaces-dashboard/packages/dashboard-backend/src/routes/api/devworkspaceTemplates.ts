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
import { baseApiPath } from '../../constants/config';
import {
  namespacedSchema,
  namespacedTemplateSchema,
  dwTemplatePatchSchema,
  templateStartedSchema,
} from '../../constants/schemas';
import { getDevWorkspaceClient } from './helpers/getDevWorkspaceClient';
import { getToken } from './helpers/getToken';
import { getSchema } from '../../services/helpers';
import { restParams } from '../../typings/models';

const tags = ['Devworkspace Template'];

export function registerDevWorkspaceTemplates(server: FastifyInstance) {
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
}
