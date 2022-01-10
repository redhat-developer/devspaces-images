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
import { CLUSTER_CONSOLE_URL } from './devworkspace-client/services/cluster-info';
import { registerDockerConfigApi } from './api/dockerConfigApi';
import { registerServerConfigApi } from './api/serverConfigApi';
import { registerKubeConfigApi } from './api/kubeConfigAPI';

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

registerStaticServer(publicFolder, server);

registerSwagger(server);

registerDevworkspaceApi(server);

registerDevworkspaceWebsocketWatcher(server);

registerTemplateApi(server);

registerDockerConfigApi(server);

registerServerConfigApi(server);

registerKubeConfigApi(server);

if (CLUSTER_CONSOLE_URL) {
  registerClusterInfo(server);
}

registerCors(isLocalRun, server);
if (isLocalRun) {
  registerLocalServers(server, CHE_HOST);
}

server.listen(8080, '0.0.0.0', (err: Error, address: string) => {
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
  console.log(server.printRoutes());
});
