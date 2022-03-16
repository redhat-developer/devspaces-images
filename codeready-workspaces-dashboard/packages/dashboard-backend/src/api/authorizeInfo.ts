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
import { baseApiPath } from '../constants/config';
import { getSchema } from '../services/helpers';

const tags = ['authorize'];

export function authorizeInfo(server: FastifyInstance) {
  server.get(`${baseApiPath}/token`, getSchema({ tags }), async () => {
    const clusterAccessToken = process.env.CLUSTER_ACCESS_TOKEN as string;
    const authorization = clusterAccessToken ? 'Bearer ' + clusterAccessToken : undefined;
    return { authorization };
  });
}
