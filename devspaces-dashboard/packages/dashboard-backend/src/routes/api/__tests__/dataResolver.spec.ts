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
import { axiosInstance, axiosInstanceNoCert } from '@/routes/api/helpers/getCertificateAuthority';
import { createFastifyError } from '@/services/helpers';
import { setup, teardown } from '@/utils/appBuilder';

jest.mock('@/routes/api/helpers/getCertificateAuthority');
const axiosInstanceMock = jest.fn();
(axiosInstance.get as jest.Mock).mockImplementation(axiosInstanceMock);
const defaultAxiosInstanceMock = jest.fn();
(axiosInstanceNoCert.get as jest.Mock).mockImplementation(defaultAxiosInstanceMock);

describe('Data Resolver Route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST ${baseApiPath}/data/resolver', () => {
    describe('with certificate authority', () => {
      beforeEach(() => {
        defaultAxiosInstanceMock.mockRejectedValueOnce({
          response: {
            headers: {},
            status: 500,
            config: {},
            statusText: '500 Internal Server Error',
            data: createFastifyError(
              'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
              'Internal Server Error',
              500,
            ),
          },
        });
      });

      test('file exists', async () => {
        axiosInstanceMock.mockResolvedValueOnce({
          status: 200,
          data: 'test content',
        });

        const res = await app
          .inject()
          .post(`${baseApiPath}/data/resolver`)
          .payload({ url: 'https://devfile.yaml' });

        expect(defaultAxiosInstanceMock).toHaveBeenCalledTimes(1);
        expect(axiosInstanceMock).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual('test content');
      });

      test('file not found', async () => {
        axiosInstanceMock.mockRejectedValueOnce({
          response: {
            headers: {},
            status: 404,
            config: {},
            statusText: '404 Not Found',
            data: createFastifyError('ERR_BAD_REQUEST', 'Not Found', 404),
          },
        });

        const res = await app
          .inject()
          .post(`${baseApiPath}/data/resolver`)
          .payload({ url: 'https://devfile.yaml' });

        expect(defaultAxiosInstanceMock).toHaveBeenCalledTimes(1);
        expect(axiosInstanceMock).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toEqual(404);
        expect(res.body).toEqual(
          '{"statusCode":404,"code":"ERR_BAD_REQUEST","error":"Not Found","message":"Not Found"}',
        );
      });
    });
    describe('without certificate authority', () => {
      test('file exists', async () => {
        defaultAxiosInstanceMock.mockResolvedValueOnce({
          status: 200,
          data: 'test content',
        });

        const res = await app
          .inject()
          .post(`${baseApiPath}/data/resolver`)
          .payload({ url: 'https://devfile.yaml' });

        expect(defaultAxiosInstanceMock).toHaveBeenCalledTimes(1);
        expect(axiosInstanceMock).toHaveBeenCalledTimes(0);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual('test content');
      });

      test('file not found', async () => {
        const fastifyError = createFastifyError('ERR_BAD_REQUEST', 'Not Found', 404);
        defaultAxiosInstanceMock.mockRejectedValueOnce({
          response: {
            headers: {},
            status: 404,
            config: {},
            statusText: '404 Not Found',
            data: fastifyError,
          },
        });

        const res = await app
          .inject()
          .post(`${baseApiPath}/data/resolver`)
          .payload({ url: 'https://devfile.yaml' });

        expect(defaultAxiosInstanceMock).toHaveBeenCalledTimes(1);
        expect(axiosInstanceMock).toHaveBeenCalledTimes(0);
        expect(res.statusCode).toEqual(404);
        expect(res.body).toEqual(
          '{"statusCode":404,"code":"ERR_BAD_REQUEST","error":"Not Found","message":"Not Found"}',
        );
      });
    });
  });
});
