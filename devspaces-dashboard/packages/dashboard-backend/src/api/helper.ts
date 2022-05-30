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
import { existsSync, readFileSync } from 'fs';
import { isLocalRun } from '../local-run';

const SERVICE_ACCOUNT_TOKEN_PATH = '/run/secrets/kubernetes.io/serviceaccount/token';
const AUTHORIZATION_BEARER_PREFIX = /^Bearer /;
const dwClientProvider = new DwClientProvider();

/**
 * Creates DevWorkspace Client depending on the context for the specified request.
 */
export function getDevWorkspaceClient(token: string): Promise<DevWorkspaceClient> {
  return dwClientProvider.getDWClient(token);
}

export function getToken(request: FastifyRequest): string {
  const authorization = request.headers?.authorization;
  if (!authorization || !AUTHORIZATION_BEARER_PREFIX.test(authorization)) {
    throw createFastifyError('FST_UNAUTHORIZED', 'Bearer Token Authorization is required', 401);
  }
  return authorization.replace(AUTHORIZATION_BEARER_PREFIX, '').trim();
}

export async function getServiceAccountToken(request: FastifyRequest): Promise<string> {
  if (isLocalRun) {
    return process.env.SERVICE_ACCOUNT_TOKEN as string;
  }
  await checkUserAuthorization(request);
  if (!existsSync(SERVICE_ACCOUNT_TOKEN_PATH)) {
    console.error('SERVICE_ACCOUNT_TOKEN is required');
    process.exit(1);
  }
  return readFileSync(SERVICE_ACCOUNT_TOKEN_PATH).toString();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function checkUserAuthorization(request: FastifyRequest): Promise<void> {
  // TODO: add user authorization check
  return Promise.resolve();
}
