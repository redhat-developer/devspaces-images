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

import mockAxios from 'axios';

import { getFactoryResolver, refreshFactoryOauthToken } from '@/services/backend-client/factoryApi';
import devfileApi from '@/services/devfileApi';
import { FactoryResolver } from '@/services/helpers/types';

describe('Factory API', () => {
  const mockPost = mockAxios.post as jest.Mock;

  const location = 'https://github.com/eclipse-che/che-dashboard.git';
  const factoryResolver: FactoryResolver = {
    v: '4.0',
    source: 'devfile.yaml',
    scm_info: {
      clone_url: location,
      scm_provider: 'github',
    },
    devfile: {
      schemaVersion: '2.2.1',
      metadata: {
        name: 'che-dashboard',
        namespace: 'namespace',
      },
    } as devfileApi.Devfile,
    links: [],
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('resolve factory', () => {
    it('should call "/factory/resolver"', async () => {
      mockPost.mockResolvedValueOnce({
        data: expect.anything(),
      });
      await getFactoryResolver(location, {});

      expect(mockPost).toBeCalledWith('/api/factory/resolver', {
        url: 'https://github.com/eclipse-che/che-dashboard.git',
      });
    });

    it('should return a factory resolver', async () => {
      mockPost.mockResolvedValueOnce({
        data: factoryResolver,
      });

      const res = await getFactoryResolver(location, {});

      expect(res).toEqual(factoryResolver);
    });
  });

  describe('refresh factory OAuth token', () => {
    it('should call "/api/factory/token/refresh?url=${url}"', async () => {
      mockPost.mockResolvedValueOnce({
        data: expect.anything(),
      });

      await refreshFactoryOauthToken(location);

      expect(mockPost).toBeCalledWith(
        '/api/factory/token/refresh?url=https://github.com/eclipse-che/che-dashboard.git',
      );
    });

    it('should return undefined', async () => {
      mockPost.mockResolvedValueOnce(undefined);

      const res = await refreshFactoryOauthToken(location);

      expect(res).toBeUndefined();
    });
  });
});
