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

import { FastifyInstance } from 'fastify';
import { ClusterConfig } from '@eclipse-che/common';
import { baseApiPath } from '../constants/config';
import { getSchema } from '../services/helpers';
import { getDevWorkspaceClient, getServiceAccountToken } from './helper';

const tags = ['clusterConfig'];

export function registerClusterConfig(server: FastifyInstance) {
  server.get(`${baseApiPath}/cluster-config`, getSchema({ tags }), async () =>
    buildClusterConfig(),
  );
}

async function buildClusterConfig(): Promise<ClusterConfig> {
  const token = getServiceAccountToken();
  const { serverConfigApi } = await getDevWorkspaceClient(token);

  const cheCustomResource = await serverConfigApi.getCheCustomResource();
  const dashboardWarning = await serverConfigApi.getDashboardWarning(cheCustomResource);
  const runningWorkspacesLimit = await serverConfigApi.getRunningWorkspacesLimit(cheCustomResource);

  return { dashboardWarning, runningWorkspacesLimit };
}
