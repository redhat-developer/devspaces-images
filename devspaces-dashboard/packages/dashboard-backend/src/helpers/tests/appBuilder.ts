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

import fastify, { FastifyInstance } from 'fastify';
import buildApp from '../../app';

jest.mock('args');

export async function setup(options?: {
  env?: { [envName: string]: string };
}): Promise<FastifyInstance> {
  process.env = Object.assign(
    {
      CHE_HOST: 'localhost',
    },
    options?.env,
  );

  const server = fastify({
    logger: false,
  });

  await buildApp(server);
  await server.ready();

  return server;
}

export function teardown(server: FastifyInstance): void {
  server.close();
}
