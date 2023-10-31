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
import { stubSshKeysList } from '@/routes/api/helpers/__mocks__/getDevWorkspaceClient';
import { setup, teardown } from '@/utils/appBuilder';

jest.mock('../helpers/getToken.ts');
jest.mock('../helpers/getDevWorkspaceClient.ts');

describe('SSH Keys Route', () => {
  let app: FastifyInstance;
  const namespace = 'user-che';

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
    jest.clearAllMocks();
  });

  test('GET ${baseApiPath}/namespace/:namespace/ssh-key', async () => {
    const res = await app.inject().get(`${baseApiPath}/namespace/${namespace}/ssh-key`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubSshKeysList);
  });

  test('POST ${baseApiPath}/namespace/:namespace/ssh-key', async () => {
    const res = await app
      .inject()
      .post(`${baseApiPath}/namespace/${namespace}/ssh-key`)
      .payload({
        name: 'test-name',
        creationTimestamp: new Date(),
        key: 'test-key',
        keyPub: 'test-key-pub',
      } as api.SshKey);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual({});
  });

  test('DELETE ${baseApiPath}/namespace/:namespace/ssh-key/:keyName', async () => {
    const name = 'key-name';

    const res = await app.inject().delete(`${baseApiPath}/namespace/${namespace}/ssh-key/${name}`);

    expect(res.statusCode).toEqual(204);
  });
});
