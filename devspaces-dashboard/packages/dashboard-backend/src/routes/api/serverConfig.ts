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
import { baseApiPath } from '../../constants/config';
import { getDevWorkspaceClient } from './helpers/getDevWorkspaceClient';
import { getServiceAccountToken } from './helpers/getServiceAccountToken';
import { getSchema } from '../../services/helpers';
import { api } from '@eclipse-che/common';

const tags = ['Server Config'];

export function registerServerConfigRoute(server: FastifyInstance) {
  server.get(`${baseApiPath}/server-config`, getSchema({ tags }), async function () {
    const token = getServiceAccountToken();
    const { serverConfigApi } = getDevWorkspaceClient(token);
    const cheCustomResource = await serverConfigApi.fetchCheCustomResource();

    const containerBuild = serverConfigApi.getContainerBuild(cheCustomResource);
    const plugins = serverConfigApi.getDefaultPlugins(cheCustomResource);
    const editor = serverConfigApi.getDefaultEditor(cheCustomResource);
    const components = serverConfigApi.getDefaultComponents(cheCustomResource);
    const inactivityTimeout = serverConfigApi.getWorkspaceInactivityTimeout(cheCustomResource);
    const runTimeout = serverConfigApi.getWorkspaceRunTimeout(cheCustomResource);
    const openVSXURL = serverConfigApi.getOpenVSXURL(cheCustomResource);
    const pvcStrategy = serverConfigApi.getPvcStrategy(cheCustomResource);

    const CheClusterCRNamespace = process.env.CHECLUSTER_CR_NAMESPACE as string;

    const serverConfig: api.IServerConfig = {
      containerBuild,
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
      pluginRegistry: {
        openVSXURL,
      },
      cheNamespace: CheClusterCRNamespace,
    };

    return serverConfig;
  });
}
