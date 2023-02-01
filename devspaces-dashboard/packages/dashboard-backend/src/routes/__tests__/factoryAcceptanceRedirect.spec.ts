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
import { setup, teardown } from '../../helpers/tests/appBuilder';

describe('Factory Acceptance Redirect', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
  });

  it('should redirect "/f?url=factoryUrl"', async () => {
    const factoryUrl = 'factoryUrl';
    const res = await app.inject({
      url: `/f?url=${factoryUrl}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(`/dashboard/#/load-factory?url=${factoryUrl}`);
  });

  it('should redirect "/dashboard/f?url=factoryUrl"', async () => {
    const factoryUrl = 'factoryUrl';
    const res = await app.inject({
      url: `/dashboard/f?url=${factoryUrl}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(`/dashboard/#/load-factory?url=${factoryUrl}`);
  });
});
