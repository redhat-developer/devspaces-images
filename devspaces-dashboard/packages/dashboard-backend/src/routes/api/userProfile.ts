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

import { FastifyInstance, FastifyRequest } from 'fastify';
import { baseApiPath } from '../../constants/config';
import { namespacedSchema } from '../../constants/schemas';
import { getSchema } from '../../services/helpers';
import { restParams } from '../../models';
import { getDevWorkspaceClient } from './helpers/getDevWorkspaceClient';
import { getToken } from './helpers/getToken';

const tags = ['UserProfile'];

export function registerUserProfileRoute(server: FastifyInstance) {
  server.get(
    `${baseApiPath}/userprofile/:namespace`,
    getSchema({ tags, params: namespacedSchema }),
    async function (request: FastifyRequest) {
      const { namespace } = request.params as restParams.INamespacedParams;
      const token = getToken(request);
      const { userProfileApi } = getDevWorkspaceClient(token);
      return userProfileApi.getUserProfile(namespace);
    },
  );
}
