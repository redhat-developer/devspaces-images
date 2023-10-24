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
import {
  stubDevWorkspace,
  stubDevWorkspacesList,
} from '@/routes/api/helpers/__mocks__/getDevWorkspaceClient';
import { setup, teardown } from '@/utils/appBuilder';

jest.mock('../helpers/getDevWorkspaceClient.ts');
jest.mock('../helpers/getToken.ts');

describe('DevWorkspaces Routes', () => {
  let app: FastifyInstance;
  const clusterConsoleUrl = 'cluster-console-url';
  const namespace = 'user-che';
  const workspaceName = 'wksp';

  beforeAll(async () => {
    const env = {
      OPENSHIFT_CONSOLE_URL: clusterConsoleUrl,
    };
    app = await setup({ env });
  });

  afterAll(() => {
    teardown(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET ${baseApiPath}/namespace/:namespace/devworkspaces', async () => {
    const res = await app.inject().get(`${baseApiPath}/namespace/${namespace}/devworkspaces`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubDevWorkspacesList);
  });

  test('POST ${baseApiPath}/namespace/:namespace/devworkspaces', async () => {
    const res = await app
      .inject()
      .post(`${baseApiPath}/namespace/${namespace}/devworkspaces`)
      .payload({ devworkspace: {} });
    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubDevWorkspace);
  });

  test('GET ${baseApiPath}/namespace/:namespace/devworkspaces/:workspaceName', async () => {
    const res = await app
      .inject()
      .get(`${baseApiPath}/namespace/${namespace}/devworkspaces/${workspaceName}`);
    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubDevWorkspace);
  });

  test('PATCH ${baseApiPath}/namespace/:namespace/devworkspaces/:workspaceName', async () => {
    const patches: api.IPatch[] = [
      {
        op: 'replace',
        path: '/metadata/annotations',
        value: {},
      },
    ];
    const res = await app
      .inject()
      .patch(`${baseApiPath}/namespace/${namespace}/devworkspaces/${workspaceName}`)
      .payload(patches);
    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubDevWorkspace);
  });

  test('DELETE ${baseApiPath}/namespace/:namespace/devworkspaces/:workspaceName', async () => {
    const res = await app
      .inject()
      .delete(`${baseApiPath}/namespace/${namespace}/devworkspaces/${workspaceName}`);
    expect(res.statusCode).toEqual(204);
    expect(res.body).toEqual('');
  });
});
