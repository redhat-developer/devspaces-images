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
import { authenticateDashboardRequestsHook } from './dashboard';

export const isLocalRun = process.env['LOCAL_RUN'] === 'true';
export const isNativeAuth = process.env['NATIVE_AUTH'] === 'true';

const cheApiProxyUpstream = process.env['CHE_API_PROXY_UPSTREAM'] || '';

export function registerLocalServers(server: FastifyInstance, origin: string) {
  console.log('Running locally, setting up stubs');

  if (isNativeAuth) {
    authenticateDashboardRequestsHook(server);
  }

  registerCheApiProxy(server, cheApiProxyUpstream, origin);
}
