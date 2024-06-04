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
});
