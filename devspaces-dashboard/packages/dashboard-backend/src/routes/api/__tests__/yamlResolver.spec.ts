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
import * as mockNodeFetch from 'node-fetch';

import { baseApiPath } from '@/constants/config';
import { setup, teardown } from '@/utils/appBuilder';

const { Response } = jest.requireActual<typeof mockNodeFetch>('node-fetch');

jest.mock('../helpers/getDevWorkspaceClient.ts');
jest.mock('../helpers/getToken.ts');

describe('Server Config Route', () => {
  let app: FastifyInstance;
  const namespace = 'user-che';

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
  });

  describe('POST ${baseApiPath}/namespace/:namespace/yaml/resolver', () => {
    test('file exists', async () => {
      const devfileContent = 'devfile content';
      (mockNodeFetch.default as unknown as jest.Mock).mockReturnValue(
        Promise.resolve(new Response(devfileContent)),
      );

      const res = await app
        .inject()
        .post(`${baseApiPath}/namespace/${namespace}/yaml/resolver`)
        .payload({ url: 'https://devfile.yaml' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(devfileContent);
    });

    test('file not found', async () => {
      const responseText = 'not found';
      (mockNodeFetch.default as unknown as jest.Mock).mockResolvedValue(
        new Response(responseText, { status: 404 }),
      );

      const res = await app
        .inject()
        .post(`${baseApiPath}/namespace/${namespace}/yaml/resolver`)
        .payload({ url: 'https://devfile.yaml' });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual(responseText);
    });
  });
});
