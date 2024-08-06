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
import * as stream from 'stream';

import { baseApiPath } from '@/constants/config';
import { DevWorkspaceClient } from '@/devworkspaceClient';
import { getDevWorkspaceClient } from '@/routes/api/helpers/getDevWorkspaceClient';
import { setup, teardown } from '@/utils/appBuilder';

jest.mock('@/routes/api/helpers/getServiceAccountToken');
jest.mock('@/routes/api/helpers/getDevWorkspaceClient');

describe('AirGap Sample Route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
    jest.clearAllMocks();
  });

  test('GET ${baseApiPath}/airgap-sample', async () => {
    (getDevWorkspaceClient as jest.Mock).mockImplementation(() => {
      return {
        airGapSampleApi: {
          list: () => Promise.resolve('[]'),
        },
      } as unknown as DevWorkspaceClient;
    });

    const res = await app.inject().get(`${baseApiPath}/airgap-sample`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual([]);
  });

  test('GET ${baseApiPath}/devfile/download', async () => {
    (getDevWorkspaceClient as jest.Mock).mockImplementation(() => {
      return {
        airGapSampleApi: {
          downloadDevfile: () =>
            Promise.resolve({
              stream: new stream.Readable({
                read() {
                  this.push('devfile');
                  this.push(null);
                },
              }),
              size: 6,
            }),
        },
      } as unknown as DevWorkspaceClient;
    });

    const res = await app.inject().get(`${baseApiPath}/airgap-sample/devfile/download?name=sample`);

    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toEqual('application/octet-stream');
    expect(res.headers['content-length']).toEqual('6');
    expect(res.body).toEqual('devfile');
  });

  test('GET ${baseApiPath}/project/download', async () => {
    (getDevWorkspaceClient as jest.Mock).mockImplementation(() => {
      return {
        airGapSampleApi: {
          downloadProject: () =>
            Promise.resolve({
              stream: new stream.Readable({
                read() {
                  this.push('project');
                  this.push(null);
                },
              }),
              size: 7,
            }),
        },
      } as unknown as DevWorkspaceClient;
    });

    const res = await app.inject().get(`${baseApiPath}/airgap-sample/project/download?name=sample`);

    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toEqual('application/octet-stream');
    expect(res.headers['content-length']).toEqual('7');
    expect(res.body).toEqual('project');
  });
});
