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
import { editorsArray } from '@/routes/api/helpers/__mocks__/getDevWorkspaceClient';
import { setup, teardown } from '@/utils/appBuilder';

jest.mock('@/routes/api/helpers/getServiceAccountToken');
jest.mock('@/routes/api/helpers/getDevWorkspaceClient');

import { DevWorkspaceClient } from '@/devworkspaceClient';
import { EditorNotFoundError } from '@/devworkspaceClient/services/editorsApi';
import { getDevWorkspaceClient } from '@/routes/api/helpers/getDevWorkspaceClient';

describe('Editors Route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
    jest.clearAllMocks();
  });

  test('GET ${baseApiPath}/editors', async () => {
    const res = await app.inject().get(`${baseApiPath}/editors`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(editorsArray);
  });

  test('GET ${baseApiPath}/editors/devfile', async () => {
    const res = await app.inject().get(`${baseApiPath}/editors/devfile`);
    expect(res.statusCode).toEqual(400);
  });

  test('GET ${baseApiPath}/editors/devfile with che-editor queryparam', async () => {
    const expectedDevfile = `schemaVersion: 2.2.2
metadata:
  name: che-code
  attributes:
    publisher: che-incubator
    version: latest
`;

    const res = await app
      .inject()
      .get(`${baseApiPath}/editors/devfile?che-editor=che-incubator/che-code/latest`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(expectedDevfile);
  });

  test('GET ${baseApiPath}/editors/devfile handle throw EditorNotFoundError', async () => {
    (getDevWorkspaceClient as jest.Mock).mockImplementation(() => {
      return {
        editorsApi: {
          get: () => Promise.reject(new EditorNotFoundError('Error')),
        },
      } as unknown as DevWorkspaceClient;
    });

    const res = await app
      .inject()
      .get(`${baseApiPath}/editors/devfile?che-editor=che-incubator/che-code/latest`);
    expect(res.statusCode).toEqual(404);
  });

  test('GET ${baseApiPath}/editors/devfile handle throw Error', async () => {
    (getDevWorkspaceClient as jest.Mock).mockImplementation(() => {
      return {
        editorsApi: {
          get: () => Promise.reject(new Error('Error')),
        },
      } as unknown as DevWorkspaceClient;
    });

    const res = await app
      .inject()
      .get(`${baseApiPath}/editors/devfile?che-editor=che-incubator/che-code/latest`);
    expect(res.statusCode).toEqual(500);
  });
});
