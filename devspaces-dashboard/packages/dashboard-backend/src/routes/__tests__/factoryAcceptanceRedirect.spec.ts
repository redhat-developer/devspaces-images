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

import { setup, teardown } from '@/utils/appBuilder';

jest.mock('../api/helpers/getDevWorkspaceClient.ts');
describe('Factory Acceptance Redirect', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
  });

  it('should redirect to "/load-factory?url=factoryUrl" (no `factoryLink` param)', async () => {
    const factoryUrl = 'factoryUrl';
    const res = await app.inject({
      url: `/f?url=${factoryUrl}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(`/dashboard/#/load-factory?url=${factoryUrl}`);
  });

  it('should redirect to "/load-factory?url=factoryUrl"', async () => {
    const factoryUrl = 'factoryUrl';
    const res = await app.inject({
      url: `/f?factoryLink=${encodeURIComponent(btoa('url=' + factoryUrl))}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(`/dashboard/#/load-factory?url=${factoryUrl}`);
  });

  it('should redirect to "/load-factory?che-editor=che-incubator%2F.che-code%2Finsiders&override.devfileFilename=my.devfile.yaml&url=factoryUrl"', async () => {
    const factoryUrl = 'factoryUrl';
    const res = await app.inject({
      url: `/f?${encodeURIComponent(
        `factoryLink=${encodeURIComponent(
          btoa(
            'che-editor=che-incubator/.che-code/insiders&override.devfileFilename=my.devfile.yaml&url=factoryUrl',
          ),
        )}`,
      )}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(
      `/dashboard/#/load-factory?che-editor=che-incubator%2F.che-code%2Finsiders&override.devfileFilename=my.devfile.yaml&url=${factoryUrl}`,
    );
  });

  it('should redirect to "/load-factory?url=factoryUrl" (with extra encoding)', async () => {
    const factoryUrl = 'factoryUrl';
    const res = await app.inject({
      url: `/f?factoryLink%3D${encodeURIComponent(btoa('url=' + factoryUrl))}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(`/dashboard/#/load-factory?url=${factoryUrl}`);
  });

  it('should redirect to "/load-factory?url=factoryUrl&error_code=access_denied" (with extra encoding)', async () => {
    const factoryUrl = 'factoryUrl';
    const res = await app.inject({
      url: `/f?factoryLink%3D${encodeURIComponent(
        btoa('url=' + factoryUrl + '&error_code=access_denied'),
      )}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(
      `/dashboard/#/load-factory?url=${factoryUrl}&error_code=access_denied`,
    );
  });

  it('should redirect to "/load-factory?url=https%3A%2F%2Fgithub.com%2Folexii4%2Fhelloworld.git"', async () => {
    const res = await app.inject({
      url: `/f?factoryLink=${encodeURIComponent(
        btoa('url=https%3A%2F%2Fgithub.com%2Folexii4%2Fhelloworld.git'),
      )}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(
      `/dashboard/#/load-factory?url=https%3A%2F%2Fgithub.com%2Folexii4%2Fhelloworld.git`,
    );
  });

  it('should redirect to "/load-factory?override.devfileFilename=devfile2.yaml&url=https%3A%2F%2Fgithub.com%2Folexii4%2Fhelloworld.git"', async () => {
    const res = await app.inject({
      url: `/f?factoryLink=${encodeURIComponent(
        btoa(
          'override.devfileFilename=devfile2.yaml&url=https%3A%2F%2Fgithub.com%2Folexii4%2Fhelloworld.git',
        ),
      )}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(
      `/dashboard/#/load-factory?override.devfileFilename=devfile2.yaml&url=https%3A%2F%2Fgithub.com%2Folexii4%2Fhelloworld.git`,
    );
  });
});
