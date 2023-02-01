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

import { IPatch } from '@eclipse-che/common/src/dto/api';
import { FastifyInstance } from 'fastify';
import { baseApiPath } from '../../../constants/config';
import { setup, teardown } from '../../../helpers/tests/appBuilder';
import {
  stubDevWorkspaceTemplate,
  stubDevWorkspaceTemplatesList,
} from '../helpers/__mocks__/getDevWorkspaceClient';

jest.mock('../helpers/getDevWorkspaceClient.ts');
jest.mock('../helpers/getToken.ts');

describe('DevWorkspaceTemplates Routes', () => {
  let app: FastifyInstance;
  const clusterConsoleUrl = 'cluster-console-url';
  const namespace = 'user-che';

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

  test('GET ${baseApiPath}/namespace/:namespace/devworkspacetemplates', async () => {
    const res = await app
      .inject()
      .get(`${baseApiPath}/namespace/${namespace}/devworkspacetemplates`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubDevWorkspaceTemplatesList);
  });

  test('POST ${baseApiPath}/namespace/:namespace/devworkspacetemplates', async () => {
    const res = await app
      .inject()
      .post(`${baseApiPath}/namespace/${namespace}/devworkspacetemplates`)
      .payload({ template: {} });

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubDevWorkspaceTemplate);
  });

  test('PATCH ${baseApiPath}/namespace/:namespace/devworkspacetemplates/:templateName', async () => {
    const templateName = 'tmpl';
    const patches: IPatch[] = [
      {
        op: 'replace',
        path: '/metadata/annotations',
        value: {},
      },
    ];
    const res = await app
      .inject()
      .patch(`${baseApiPath}/namespace/${namespace}/devworkspacetemplates/${templateName}`)
      .payload(patches);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubDevWorkspaceTemplate);
  });
});
