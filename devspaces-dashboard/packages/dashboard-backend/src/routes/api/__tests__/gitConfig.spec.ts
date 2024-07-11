/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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
import { setup, teardown } from '@/utils/appBuilder';

const mockRead = jest.fn().mockResolvedValue({});
const mockPatch = jest.fn().mockResolvedValue({});
jest.mock('../helpers/getDevWorkspaceClient.ts', () => ({
  getDevWorkspaceClient: () => ({
    gitConfigApi: {
      read: mockRead,
      patch: mockPatch,
    },
  }),
}));
jest.mock('../helpers/getToken.ts');

describe('Gitconfig Routes', () => {
  let app: FastifyInstance;
  const namespace = 'user-che';

  beforeAll(async () => {
    app = await setup();
  });

  afterEach(() => {
    teardown(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET ${baseApiPath}/namespace/:namespace/gitconfig', async () => {
    const res = await app.inject().get(`${baseApiPath}/namespace/${namespace}/gitconfig`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual({});

    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockPatch).not.toHaveBeenCalled();
  });

  test('PATCH ${baseApiPath}/namespace/:namespace/gitconfig', async () => {
    const res = await app
      .inject()
      .patch(`${baseApiPath}/namespace/${namespace}/gitconfig`)
      .payload({
        gitconfig: {
          user: {
            name: 'user-che',
            email: 'user@che',
          },
          alias: {
            co: 'checkout',
            st: 'status',
            br: 'branch',
          },
        },
        resourceVersion: '123456789',
      } as api.IGitConfig);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual({});

    expect(mockRead).not.toHaveBeenCalled();
    expect(mockPatch).toHaveBeenCalledTimes(1);
  });
});
