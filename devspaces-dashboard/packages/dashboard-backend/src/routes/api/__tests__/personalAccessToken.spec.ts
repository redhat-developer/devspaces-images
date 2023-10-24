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

import { api } from '@eclipse-che/common';
import { FastifyInstance } from 'fastify';

import { baseApiPath } from '@/constants/config';
import { stubPersonalAccessTokenList } from '@/routes/api/helpers/__mocks__/getDevWorkspaceClient';
import { setup, teardown } from '@/utils/appBuilder';

jest.mock('../helpers/getToken.ts');
jest.mock('../helpers/getDevWorkspaceClient.ts');

describe('Personal Access Token Route', () => {
  let app: FastifyInstance;
  const namespace = 'user-che';

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
    jest.clearAllMocks();
  });

  test('GET ${baseApiPath}/namespace/:namespace/personal-access-token', async () => {
    const res = await app
      .inject()
      .get(`${baseApiPath}/namespace/${namespace}/personal-access-token`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubPersonalAccessTokenList);
  });

  test('POST ${baseApiPath}/namespace/:namespace/personal-access-token', async () => {
    const res = await app
      .inject()
      .post(`${baseApiPath}/namespace/${namespace}/personal-access-token`)
      .payload({
        tokenName: 'test',
        cheUserId: 'test',
        gitProvider: 'github',
        gitProviderEndpoint: 'https://github.com',
        tokenData: 'test',
      } as api.PersonalAccessToken);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual({});
  });

  test('PATCH ${baseApiPath}/namespace/:namespace/personal-access-token', async () => {
    const res = await app
      .inject()
      .patch(`${baseApiPath}/namespace/${namespace}/personal-access-token`)
      .payload({
        tokenName: 'test',
        cheUserId: 'test',
        gitProvider: 'github',
        gitProviderEndpoint: 'https://github.com',
        tokenData: 'test',
      } as api.PersonalAccessToken);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual({});
  });

  test('DELETE ${baseApiPath}/namespace/:namespace/personal-access-token/:tokenName', async () => {
    const tokenName = 'token-name';

    const res = await app
      .inject()
      .delete(`${baseApiPath}/namespace/${namespace}/personal-access-token/${tokenName}`);

    expect(res.statusCode).toEqual(204);
  });
});
