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

import { FastifyRequest } from 'fastify';
import { createFastifyError } from '../../../services/helpers';

const authorizationBearerPrefix = /^Bearer /;

export function getToken(request: FastifyRequest): string {
  const authorization = request.headers?.authorization;
  if (!authorization || !authorizationBearerPrefix.test(authorization)) {
    throw createFastifyError('FST_UNAUTHORIZED', 'Bearer Token Authorization is required', 401);
  }
  return authorization.replace(authorizationBearerPrefix, '').trim();
}
