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
import { baseApiPath } from '../../../constants/config';
import { setup, teardown } from '../../../helpers/tests/appBuilder';
import { stubNamespaces } from '../helpers/__mocks__/getDevWorkspaceClient';

const mockIsLocalRun = jest.fn();
jest.mock('../../../localRun', () => {
  return {
    isLocalRun: () => mockIsLocalRun(),
    registerLocalRun: () => undefined,
  };
});

jest.mock('../helpers/getDevWorkspaceClient.ts');
jest.mock('../helpers/getToken.ts');
jest.mock('../helpers/getServiceAccountToken.ts');

describe('Namespaces Route', () => {
  let app: FastifyInstance;

  afterEach(() => {
    teardown(app);
  });

  describe('GET ${baseApiPath}/namespaces', () => {
    test('development mode', async () => {
      mockIsLocalRun.mockReturnValue(true);
      app = await setup();

      const res = await app.inject().get(`${baseApiPath}/namespaces`);

      expect(res.statusCode).toEqual(200);
      expect(res.json()).toEqual(stubNamespaces);
    });

    test('production mode', async () => {
      mockIsLocalRun.mockReturnValue(false);
      app = await setup();

      const res = await app.inject().get(`${baseApiPath}/namespaces`);

      expect(res.statusCode).toEqual(404);
    });
  });
});
