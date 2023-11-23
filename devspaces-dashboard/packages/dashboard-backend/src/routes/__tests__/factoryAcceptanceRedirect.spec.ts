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

import { setup, teardown } from '@/utils/appBuilder';

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

  it('should redirect "/f?factoryLink=url%3DfactoryUrl"', async () => {
    const factoryUrl = 'factoryUrl';
    const res = await app.inject({
      url: `/f?factoryLink=${encodeURIComponent('url=' + factoryUrl)}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(`/dashboard/#/load-factory?url=${factoryUrl}`);
  });

  it('should redirect "/f?factoryLink=che-editor=che-incubator/.che-code/insiders&override.devfileFilename=my.devfile.yaml&url=factoryUr"', async () => {
    const factoryUrl = 'factoryUrl';
    const res = await app.inject({
      url: `/f?${encodeURIComponent(
        'factoryLink=che-editor=che-incubator/.che-code/insiders&override.devfileFilename=my.devfile.yaml&url=factoryUrl',
      )}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(
      `/dashboard/#/load-factory?che-editor=che-incubator%2F.che-code%2Finsiders&override.devfileFilename=my.devfile.yaml&url=${factoryUrl}`,
    );
  });

  it('should redirect "/f?url=factoryUrl"', async () => {
    const factoryUrl = 'factoryUrl';
    const res = await app.inject({
      url: `/f?url=${factoryUrl}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(`/dashboard/#/load-factory?url=${factoryUrl}`);
  });

  it('should redirect "/f?factoryLink%3Durl%3DfactoryUrl"', async () => {
    const factoryUrl = 'factoryUrl';
    const res = await app.inject({
      url: `/f?factoryLink%3Durl%3D${factoryUrl}`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(`/dashboard/#/load-factory?url=${factoryUrl}`);
  });

  it('should redirect "/f?factoryLink%3Durl%3DfactoryUrl%26error_code%3Daccess_denied"', async () => {
    const factoryUrl = 'factoryUrl';
    const res = await app.inject({
      url: `/f?factoryLink%3Durl%3D${factoryUrl}%26error_code%3Daccess_denied`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(
      `/dashboard/#/load-factory?url=${factoryUrl}&error_code=access_denied`,
    );
  });

  it('should redirect "/f?factoryLink=url%3Dhttps%253A%252F%252Fgithub.com%252Folexii4%252Fhelloworld.git"', async () => {
    const res = await app.inject({
      url: `/f?factoryLink=url%3Dhttps%253A%252F%252Fgithub.com%252Folexii4%252Fhelloworld.git`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(
      `/dashboard/#/load-factory?url=https%3A%2F%2Fgithub.com%2Folexii4%2Fhelloworld.git`,
    );
  });

  it('should redirect "/f?factoryLink=override.devfileFilename%3Ddevfile2.yaml%26url%3Dhttps%253A%252F%252Fgithub.com%252Folexii4%252Fhelloworld.git"', async () => {
    const res = await app.inject({
      url: `/f?factoryLink=override.devfileFilename%3Ddevfile2.yaml%26url%3Dhttps%253A%252F%252Fgithub.com%252Folexii4%252Fhelloworld.git`,
    });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(
      `/dashboard/#/load-factory?override.devfileFilename=devfile2.yaml&url=https%3A%2F%2Fgithub.com%2Folexii4%2Fhelloworld.git`,
    );
  });
});
