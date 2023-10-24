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

import fastify from 'fastify';
import process from 'process';

import buildApp from '@/app';
import { isLocalRun } from '@/localRun';
import { watchLogLevel } from '@/services/logWatcher';
import { stream } from '@/utils/logger';

(async function startServer() {
  const server = fastify({
    logger: {
      stream,
    },
  });

  await buildApp(server);

  try {
    const address = await server.listen({ port: 8080, host: '0.0.0.0' });

    if (isLocalRun()) {
      // when we're running against keycloak, 0.0.0.0 is not allowed
      // so suggesting to use whitelisted localhost instead
      server.log.info('Server listening at http://localhost:8080/');
    } else {
      server.log.info(`Server listening at ${address}`);
    }
  } catch (e) {
    server.log.fatal(e);
    process.exit(1);
  }

  await server.ready();

  server.log.info(
    server.printRoutes({
      includeMeta: false,
      commonPrefix: false,
      includeHooks: false,
    }),
  );

  // set initial log level and watch for changes
  watchLogLevel(server);
})();
