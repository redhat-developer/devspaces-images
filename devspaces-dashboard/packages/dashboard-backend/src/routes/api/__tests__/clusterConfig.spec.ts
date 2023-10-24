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

import { baseApiPath } from '@/constants/config';
import {
  stubAllWorkspacesLimit,
  stubDashboardWarning,
  stubRunningWorkspacesLimit,
} from '@/routes/api/helpers/__mocks__/getDevWorkspaceClient';
import { setup, teardown } from '@/utils/appBuilder';

jest.mock('../helpers/getServiceAccountToken.ts');
jest.mock('../helpers/getDevWorkspaceClient.ts');

describe('Cluster Config Route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
  });

  test('response payload', async () => {
    const res = await app.inject({
      url: `${baseApiPath}/cluster-config`,
    });
    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual({
      dashboardWarning: stubDashboardWarning,
      runningWorkspacesLimit: stubRunningWorkspacesLimit,
      allWorkspacesLimit: stubAllWorkspacesLimit,
    });
  });
});
