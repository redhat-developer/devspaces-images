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

import { ClusterConfig } from '@eclipse-che/common';
import { FastifyInstance } from 'fastify';

import { baseApiPath } from '@/constants/config';
import { getDevWorkspaceClient } from '@/routes/api/helpers/getDevWorkspaceClient';
import { getServiceAccountToken } from '@/routes/api/helpers/getServiceAccountToken';
import { getSchema } from '@/services/helpers';

const tags = ['Cluster Config'];

export function registerClusterConfigRoute(instance: FastifyInstance) {
  instance.register(async server => {
    server.get(`${baseApiPath}/cluster-config`, getSchema({ tags }), async () =>
      buildClusterConfig(),
    );
  });
}

async function buildClusterConfig(): Promise<ClusterConfig> {
  const token = getServiceAccountToken();
  const { serverConfigApi } = getDevWorkspaceClient(token);

  const cheCustomResource = await serverConfigApi.fetchCheCustomResource();
  const dashboardWarning = serverConfigApi.getDashboardWarning(cheCustomResource);
  const runningWorkspacesLimit = serverConfigApi.getRunningWorkspacesLimit(cheCustomResource);
  const allWorkspacesLimit = serverConfigApi.getAllWorkspacesLimit(cheCustomResource);

  return { dashboardWarning, allWorkspacesLimit, runningWorkspacesLimit };
}
