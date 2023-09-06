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

import { FastifyInstance } from 'fastify';
import { baseApiPath } from '../../constants/config';
import { getSchema } from '../../services/helpers';
import { getDevWorkspaceClient } from './helpers/getDevWorkspaceClient';
import { getServiceAccountToken } from './helpers/getServiceAccountToken';

const tags = ['Getting Started Samples'];

export function registerGettingStartedSamplesRoutes(instance: FastifyInstance) {
  instance.register(async server => {
    server.get(`${baseApiPath}/getting-started-sample`, getSchema({ tags }), async () => {
      const token = getServiceAccountToken();
      const { gettingStartedSampleApi } = getDevWorkspaceClient(token);
      return gettingStartedSampleApi.list();
    });
  });
}
