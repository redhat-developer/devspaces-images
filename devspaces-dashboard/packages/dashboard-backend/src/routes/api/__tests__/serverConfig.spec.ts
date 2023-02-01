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

jest.mock('../helpers/getDevWorkspaceClient.ts');
jest.mock('../helpers/getToken.ts');
jest.mock('../helpers/getServiceAccountToken.ts');

describe('Server Config Route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
  });

  test('GET ${baseApiPath}/server-config', async () => {
    const res = await app.inject().get(`${baseApiPath}/server-config`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual({
      containerBuild: {
        disableContainerBuildCapabilities: true,
      },
      defaults: { components: [], plugins: [], pvcStrategy: '' },
      pluginRegistry: { openVSXURL: 'openvsx-url' },
      timeouts: { inactivityTimeout: 0, runTimeout: 0, startTimeout: 0 },
    });
  });
});
