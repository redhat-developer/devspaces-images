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

describe('Kube Config Route', () => {
  let app: FastifyInstance;
  const namespace = 'user-che';

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
  });

  test('POST ${baseApiPath}/namespace/:namespace/devworkspaceId/:devworkspaceId/kubeconfig', async () => {
    const devworkspaceId = 'wksp-id';
    const res = await app
      .inject()
      .post(`${baseApiPath}/namespace/${namespace}/devworkspaceId/${devworkspaceId}/kubeconfig`)
      .payload({});

    expect(res.statusCode).toEqual(204);
  });
});
