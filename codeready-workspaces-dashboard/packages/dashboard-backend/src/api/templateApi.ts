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
import { namespacedSchema, templateStartedSchema } from '../constants/schemas';
import { getDevWorkspaceClient } from './helper';
import { getSchema } from '../services/helpers';
import { restParams } from '../typings/models';

const tags = ['template'];

export function registerTemplateApi(server: FastifyInstance) {
  server.post(
    `${baseApiPath}/namespace/:namespace/devworkspacetemplates`,
    getSchema({
      tags,
      params: namespacedSchema,
      body: templateStartedSchema
    }),
    async function (request: FastifyRequest) {
      const { template } = request.body as restParams.ITemplateBodyParam;
      const { namespace } = request.params as restParams.INamespacedParam;
      if (!template.metadata) {
        template.metadata = {};
      }
      template.metadata.namespace = namespace;
      const { templateApi } = await getDevWorkspaceClient(request);
      return templateApi.create(template);
    }
  );
}
