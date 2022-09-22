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
import { baseApiPath } from '../constants/config';
import { getDevWorkspaceClient, getServiceAccountToken } from './helper';
import { getSchema } from '../services/helpers';
import { api } from '@eclipse-che/common';

const CHECLUSTER_CR_NAMESPACE = process.env.CHECLUSTER_CR_NAMESPACE as string;

const tags = ['Server Config'];

export function registerServerConfigApi(server: FastifyInstance) {
  server.get(`${baseApiPath}/server-config`, getSchema({ tags }), async function () {
    const token = await getServiceAccountToken();
    const { serverConfigApi } = await getDevWorkspaceClient(token);
    const cheCustomResource = await serverConfigApi.getCheCustomResource();

    const plugins = serverConfigApi.getDefaultPlugins(cheCustomResource);
    const editor = serverConfigApi.getDefaultEditor(cheCustomResource);
    const components = serverConfigApi.getDefaultComponents(cheCustomResource);
    const inactivityTimeout = serverConfigApi.getWorkspaceInactivityTimeout(cheCustomResource);
    const runTimeout = serverConfigApi.getWorkspaceRunTimeout(cheCustomResource);
    const pvcStrategy = serverConfigApi.getPvcStrategy(cheCustomResource);
    const serverConfig: api.IServerConfig = {
      defaults: {
        editor,
        plugins,
        components,
        pvcStrategy,
      },
      timeouts: {
        inactivityTimeout,
        runTimeout,
      },
      cheNamespace: CHECLUSTER_CR_NAMESPACE,
    };
    return serverConfig;
  });
}
