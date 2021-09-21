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
import { registerCheApiProxy } from './che-server';
import { registerKeycloakProxy } from './keycloak';

export function isLocalRun(): boolean {
  return process.env['LOCAL_RUN'] === 'true';
}

export function registerLocalServers(server: FastifyInstance, origin: string) {
  console.log('Running locally, setting up stubs');

  const cheApiProxyUpstream = process.env.CHE_API_PROXY_UPSTREAM as string;
  if (!cheApiProxyUpstream) {
    console.error('CHE_API_PROXY_UPSTREAM environment variable is required');
    process.exit(1);
  }

  registerCheApiProxy(server, cheApiProxyUpstream, origin);
  registerKeycloakProxy(server, cheApiProxyUpstream, origin);
}
