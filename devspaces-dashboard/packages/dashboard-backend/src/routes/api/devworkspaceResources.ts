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
import { getSchema } from '../../services/helpers';
import { devWorkspaceResourcesSchema } from '../../constants/schemas';
import { dump } from 'js-yaml';
import { Main as DevworkspaceGenerator } from '@eclipse-che/che-devworkspace-generator/lib/main';
import { V1alpha2DevWorkspaceTemplate } from '@devfile/api';
import { axiosInstance } from './helpers/getCertificateAuthority';
import { api } from '@eclipse-che/common';

const tags = ['DevWorkspace Resources'];

export function registerDevworkspaceResourcesRoute(server: FastifyInstance) {
  const generator = new DevworkspaceGenerator();

  server.post(
    `${baseApiPath}/devworkspace-resources`,
    getSchema({ tags, body: devWorkspaceResourcesSchema }),
    async function (request: FastifyRequest) {
      const { devfileContent, editorPath, pluginRegistryUrl, editorId, editorContent } =
        request.body as api.IDevWorkspaceResources;
      const context = await generator.generateDevfileContext(
        {
          devfileContent,
          editorPath,
          pluginRegistryUrl,
          editorEntry: editorId,
          editorContent,
          projects: [],
        },
        axiosInstance,
      );
      // write templates and then DevWorkspace in a single file
      const allContentArray = context.devWorkspaceTemplates.map(
        (template: V1alpha2DevWorkspaceTemplate) => dump(template),
      );
      allContentArray.push(dump(context.devWorkspace));

      return allContentArray.join('---\n');
    },
  );
}
