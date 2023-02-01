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

import { FastifyInstance } from 'fastify';
import { ClusterConfig } from '@eclipse-che/common';
import { baseApiPath } from '../../constants/config';
import { getSchema } from '../../services/helpers';
import { getDevWorkspaceClient } from './helpers/getDevWorkspaceClient';
import { getServiceAccountToken } from './helpers/getServiceAccountToken';

const tags = ['Cluster Config'];

export function registerClusterConfigRoute(server: FastifyInstance) {
  server.get(`${baseApiPath}/cluster-config`, getSchema({ tags }), async () =>
    buildClusterConfig(),
  );
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
