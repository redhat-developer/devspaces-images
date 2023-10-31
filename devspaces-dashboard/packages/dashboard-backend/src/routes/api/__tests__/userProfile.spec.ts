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
import { stubUserProfile } from '@/routes/api/helpers/__mocks__/getDevWorkspaceClient';
import { setup, teardown } from '@/utils/appBuilder';

jest.mock('../helpers/getDevWorkspaceClient.ts');
jest.mock('../helpers/getToken.ts');
jest.mock('../helpers/getServiceAccountToken.ts');

describe('UserProfile Route', () => {
  let app: FastifyInstance;
  const namespace = 'user-che';

  beforeEach(async () => {
    app = await setup();
  });

  afterEach(() => {
    teardown(app);
  });

  test('GET ${baseApiPath}/namespaces', async () => {
    const res = await app.inject().get(`${baseApiPath}/userprofile/${namespace}`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubUserProfile);
  });
});
