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

import 'reflect-metadata';

import { helpers } from '@eclipse-che/common';
import { FastifyInstance } from 'fastify';

import parseArgs from '@/helpers/parseArgs';
import { isLocalRun, registerLocalRun } from '@/localRun';
import { registerCors } from '@/plugins/cors';
import { registerStaticServer } from '@/plugins/staticServer';
import { registerSwagger } from '@/plugins/swagger';
import { registerWebSocket } from '@/plugins/webSocket';
import { registerClusterConfigRoute } from '@/routes/api/clusterConfig';
import { registerClusterInfoRoute } from '@/routes/api/clusterInfo';
import { registerDevworkspaceResourcesRoute } from '@/routes/api/devworkspaceResources';
import { registerDevworkspacesRoutes } from '@/routes/api/devworkspaces';
import { registerDevWorkspaceTemplates } from '@/routes/api/devworkspaceTemplates';
import { registerDockerConfigRoutes } from '@/routes/api/dockerConfig';
import { registerEventsRoutes } from '@/routes/api/events';
import { registerGettingStartedSamplesRoutes } from '@/routes/api/gettingStartedSample';
import { registerGitConfigRoutes } from '@/routes/api/gitConfig';
import { registerKubeConfigRoute } from '@/routes/api/kubeConfig';
import { registerPersonalAccessTokenRoutes } from '@/routes/api/personalAccessToken';
import { registerPodmanLoginRoute } from '@/routes/api/podmanLogin';
import { registerPodsRoutes } from '@/routes/api/pods';
import { registerServerConfigRoute } from '@/routes/api/serverConfig';
import { registerSShKeysRoutes } from '@/routes/api/sshKeys';
import { registerUserProfileRoute } from '@/routes/api/userProfile';
import { registerWebsocket } from '@/routes/api/websocket';
import { registerYamlResolverRoute } from '@/routes/api/yamlResolver';
import { registerFactoryAcceptanceRedirect } from '@/routes/factoryAcceptanceRedirect';
import { registerWorkspaceRedirect } from '@/routes/workspaceRedirect';

export default async function buildApp(server: FastifyInstance): Promise<unknown> {
  const cheHost = process.env.CHE_HOST as string;
  if (!cheHost) {
    server.log.fatal('CHE_HOST environment variable is required');
    process.exit(1);
  }

  const { publicFolder } = parseArgs();

  server.addContentTypeParser(
    'application/merge-patch+json',
    { parseAs: 'string' },
    function (req, body, done) {
      try {
        const json = JSON.parse(body as string);
        done(null, json);
      } catch (e) {
        const error = new Error(helpers.errors.getMessage(e));
        server.log.warn(`Can't parse the JSON payload: %s`, body);
        done(error, undefined);
      }
    },
  );

  return Promise.allSettled([
    registerWebSocket(server),

    isLocalRun() ? registerLocalRun(server) : Promise.resolve(),

    registerCors(isLocalRun(), server),

    registerStaticServer(publicFolder, server),

    registerFactoryAcceptanceRedirect(server),

    registerWorkspaceRedirect(server),

    registerWebsocket(server),

    // swagger and API
    registerSwagger(server),

    registerClusterConfigRoute(server),

    registerClusterInfoRoute(server),

    registerDevWorkspaceTemplates(server),

    registerDevworkspacesRoutes(server),

    registerDockerConfigRoutes(server),

    registerEventsRoutes(server),

    registerPodsRoutes(server),

    registerKubeConfigRoute(server),

    registerPodmanLoginRoute(server),

    registerServerConfigRoute(server),

    registerUserProfileRoute(server),

    registerYamlResolverRoute(server),

    registerDevworkspaceResourcesRoute(server),

    registerPersonalAccessTokenRoutes(server),

    registerGitConfigRoutes(server),

    registerGettingStartedSamplesRoutes(isLocalRun(), server),

    registerSShKeysRoutes(server),
  ]);
}
