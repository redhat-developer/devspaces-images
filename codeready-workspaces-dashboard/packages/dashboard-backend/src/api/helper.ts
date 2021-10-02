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

import { FastifyRequest } from 'fastify';
import { DwClientProvider } from '../services/kubeclient/dwClientProvider';
import { DevWorkspaceClient } from '../devworkspace-client';
import { createFastifyError } from '../services/helpers';

const AUTHORIZATION_BEARER_PREFIX = /^Bearer /;
const dwClientProvider = new DwClientProvider();

/**
 * Creates DevWorkspace Client depending on the context for the specified request.
 */
export function getDevWorkspaceClient(request: FastifyRequest): Promise<DevWorkspaceClient> {
  const token = getToken(request);

  return dwClientProvider.getDWClient(token);
}

export function getToken(request: FastifyRequest): string {
  const authorization = request.headers?.authorization;
  if (!authorization || !AUTHORIZATION_BEARER_PREFIX.test(authorization)) {
    throw createFastifyError('FST_UNAUTHORIZED', 'Bearer Token Authorization is required', 401);
  }
  return authorization.replace(AUTHORIZATION_BEARER_PREFIX, '').trim();
}
