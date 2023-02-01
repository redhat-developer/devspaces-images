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

import fastify from 'fastify';
import 'reflect-metadata';
import buildApp from './app';
import { isLocalRun } from './localRun';

const server = fastify({
  logger: false,
});
buildApp(server);

server.listen(8080, '0.0.0.0', (err: Error | null, address: string) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  if (isLocalRun()) {
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
