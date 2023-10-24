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
import { stubDockerConfig } from '@/routes/api/helpers/__mocks__/getDevWorkspaceClient';
import { setup, teardown } from '@/utils/appBuilder';

jest.mock('../helpers/getDevWorkspaceClient.ts');
jest.mock('../helpers/getToken.ts');

describe('Docker Config Routes', () => {
  let app: FastifyInstance;
  const namespace = 'user-che';

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
  });

  test('GET ${baseApiPath}/namespace/:namespace/dockerconfig', async () => {
    const res = await app.inject().get(`${baseApiPath}/namespace/${namespace}/dockerconfig`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubDockerConfig);
  });

  test('PUT ${baseApiPath}/namespace/:namespace/dockerconfig', async () => {
    const res = await app
      .inject()
      .put(`${baseApiPath}/namespace/${namespace}/dockerconfig`)
      .payload({ dockerconfig: 'dockerconfig' });

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubDockerConfig);
  });
});
