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

import 'reflect-metadata';
import fastify from 'fastify';
import args from 'args';
import { registerStaticServer } from './static';
import { registerDevworkspaceWebsocketWatcher } from './api/devworkspaceWebsocketWatcher';
import { registerDevworkspaceApi } from './api/devworkspaceApi';
import { registerTemplateApi } from './api/templateApi';
import { registerLocalServers } from './local-run';
import { registerCors } from './cors';
import { registerSwagger } from './swagger';
import { helpers } from '@eclipse-che/common';
import { isLocalRun } from './local-run';
import { registerClusterInfo } from './api/clusterInfo';
import { registerClusterConfig } from './api/clusterConfig';
import { registerDockerConfigApi } from './api/dockerConfigApi';
import { registerServerConfigApi } from './api/serverConfigApi';
import { registerKubeConfigApi } from './api/kubeConfigAPI';
import { authorizeInfo } from './api/authorizeInfo';
import fastifyWebsocket from 'fastify-websocket';
import {
  addDexProxy,
  registerDexCallback,
  registerOauth,
  addAuthorizationHooks,
} from './local-run/dexHelper';

const CHE_HOST = process.env.CHE_HOST as string;

if (!CHE_HOST) {
  console.error('CHE_HOST environment variable is required');
  process.exit(1);
}

args.option('publicFolder', 'The public folder to serve', './public');

const { publicFolder } = args.parse(process.argv) as { publicFolder: string };

const server = fastify({
  logger: false,
});

server.addContentTypeParser(
  'application/merge-patch+json',
  { parseAs: 'string' },
  function (req, body, done) {
    try {
      const json = JSON.parse(body as string);
      done(null, json);
    } catch (e) {
      const error = new Error(helpers.errors.getMessage(e));
      done(error, undefined);
    }
  },
);

server.register(fastifyWebsocket);

if (isLocalRun) {
  const DEX_INGRESS = process.env.DEX_INGRESS as string;
  if (DEX_INGRESS) {
    addDexProxy(server, `https://${DEX_INGRESS}`);
    registerDexCallback(server);
  }
  registerOauth(server);
  addAuthorizationHooks(server);
  const CHE_HOST_ORIGIN = process.env.CHE_HOST_ORIGIN as string;
  registerLocalServers(server, CHE_HOST_ORIGIN);
}

registerStaticServer(publicFolder, server);

registerSwagger(server);

if (isLocalRun) {
  authorizeInfo(server);
}

registerDevworkspaceApi(server);

registerDevworkspaceWebsocketWatcher(server);

registerTemplateApi(server);

registerDockerConfigApi(server);

registerServerConfigApi(server);

registerKubeConfigApi(server);

registerClusterInfo(server);

registerClusterConfig(server);

registerCors(isLocalRun, server);

server.listen(8080, '0.0.0.0', (err: Error | null, address: string) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  if (isLocalRun) {
    // when we're running against keycloak, 0.0.0.0 is not allowed
    // so suggesting to use whitelisted localhost instead
    console.log('Server listening at http://localhost:8080/');
  } else {
    console.log(`Server listening at ${address}`);
  }
});

server.ready(() => {
  console.log(
    server.printRoutes({
      includeMeta: false,
      commonPrefix: false,
      includeHooks: false,
    }),
  );
});
