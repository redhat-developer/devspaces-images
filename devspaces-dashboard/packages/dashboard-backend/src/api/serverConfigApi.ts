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
    return {
      defaults: {
        editor,
        plugins,
        components,
      },
      timeouts: {
        inactivityTimeout,
        runTimeout,
      },
    };
  });
}
