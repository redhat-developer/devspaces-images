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
import { axiosInstance } from '@/routes/api/helpers/getCertificateAuthority';
import { setup, teardown } from '@/utils/appBuilder';

jest.mock('@/routes/api/helpers/getDevWorkspaceClient.ts');
jest.mock('@/routes/api/helpers/getToken.ts');

jest.mock('@/routes/api/helpers/getCertificateAuthority');
const getAxiosInstanceMock = jest.fn();
(axiosInstance.get as jest.Mock).mockImplementation(getAxiosInstanceMock);

describe('Data Resolver Route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
  });

  describe('POST ${baseApiPath}/data/resolver', () => {
    test('file exists', async () => {
      const devfileContent = 'devfile content';
      getAxiosInstanceMock.mockResolvedValue({
        status: 200,
        data: devfileContent,
      });

      const res = await app
        .inject()
        .post(`${baseApiPath}/data/resolver`)
        .payload({ url: 'https://devfile.yaml' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(devfileContent);
    });

    test('file not found', async () => {
      const responseText = 'not found';
      getAxiosInstanceMock.mockResolvedValue({
        status: 404,
        data: responseText,
      });

      const res = await app
        .inject()
        .post(`${baseApiPath}/data/resolver`)
        .payload({ url: 'https://devfile.yaml' });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual(responseText);
    });
  });
});
