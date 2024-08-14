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

import { FastifyInstance } from 'fastify';

import { baseApiPath } from '@/constants/config';
import { stubWorkspacePreferences } from '@/routes/api/helpers/__mocks__/getDevWorkspaceClient';
import { setup, teardown } from '@/utils/appBuilder';

jest.mock('../helpers/getToken.ts');
jest.mock('../helpers/getDevWorkspaceClient.ts');

describe('Workspace Preferences', () => {
  let app: FastifyInstance;
  const namespace = 'user-che';

  beforeEach(async () => {
    app = await setup();
  });

  afterEach(() => {
    teardown(app);
    jest.clearAllMocks();
  });

  test('GET ${baseApiPath}/workspace-preferences/namespace/:namespace', async () => {
    const res = await app
      .inject()
      .get(`${baseApiPath}/workspace-preferences/namespace/${namespace}`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubWorkspacePreferences);
  });

  test('DELETE ${baseApiPath}/workspace-preferences/namespace/:namespace/skip-authorisation/:provider', async () => {
    const provider = 'github';
    const res = await app
      .inject()
      .delete(
        `${baseApiPath}/workspace-preferences/namespace/${namespace}/skip-authorisation/${provider}`,
      );

    expect(res.statusCode).toEqual(204);
  });

  test('POST ${baseApiPath}/workspace-preferences/namespace/:namespace/trusted-source', async () => {
    const source = 'github-repo';
    const res = await app
      .inject()
      .post(`${baseApiPath}/workspace-preferences/namespace/${namespace}/trusted-source`)
      .body({
        source,
      });

    expect(res.statusCode).toEqual(204);
  });

  test('DELETE ${baseApiPath}/workspace-preferences/namespace/:namespace/trusted-source', async () => {
    const res = await app
      .inject()
      .delete(`${baseApiPath}/workspace-preferences/namespace/${namespace}/trusted-source`);

    expect(res.statusCode).toEqual(204);
  });
});
