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

import { Main as DevworkspaceGenerator } from '@eclipse-che/che-devworkspace-generator/lib/main';
import { api } from '@eclipse-che/common';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { dump } from 'js-yaml';

import { baseApiPath } from '@/constants/config';
import { devWorkspaceResourcesSchema } from '@/constants/schemas';
import { axiosInstance } from '@/routes/api/helpers/getCertificateAuthority';
import { getSchema } from '@/services/helpers';

const tags = ['DevWorkspace Resources'];

export function registerDevworkspaceResourcesRoute(instance: FastifyInstance) {
  const generator = new DevworkspaceGenerator();

  instance.register(async server => {
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
        const allContentArray = context.devWorkspaceTemplates.map(template => dump(template));
        allContentArray.push(dump(context.devWorkspace));

        return allContentArray.join('---\n');
      },
    );
  });
}
