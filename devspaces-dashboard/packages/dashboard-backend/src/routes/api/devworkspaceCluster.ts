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

import { FastifyInstance } from 'fastify';

import { baseApiPath } from '@/constants/config';
import { getDevWorkspaceSingletonClient } from '@/routes/api/helpers/getDevWorkspaceClient';
import { getSchema } from '@/services/helpers';

const tags = ['Devworkspace Cluster'];

export function registerDevWorkspaceClusterRoutes(instance: FastifyInstance) {
  instance.register(async server => {
    server.get(
      `${baseApiPath}/devworkspace/running-workspaces-cluster-limit-exceeded`,
      getSchema({ tags }),
      async function () {
        const { devWorkspaceClusterServiceApi } = getDevWorkspaceSingletonClient();
        return await devWorkspaceClusterServiceApi.isRunningWorkspacesClusterLimitExceeded();
      },
    );
  });
}
