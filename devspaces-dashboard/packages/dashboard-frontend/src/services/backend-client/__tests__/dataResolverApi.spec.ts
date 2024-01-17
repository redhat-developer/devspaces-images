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

import common from '@eclipse-che/common';
import mockAxios, { AxiosError } from 'axios';

import { getDataResolver } from '@/services/backend-client/dataResolverApi';
import { che } from '@/services/models';

describe('Data Resolver API', () => {
  const mockPost = mockAxios.post as jest.Mock;

  const registryLocation = 'http://127.0.0.1:8080/dashboard/devfile-registry/devfiles/index.json';
  const metaData: che.DevfileMetaData[] = [
    {
      displayName: 'Empty Workspace',
      description:
        'Start an empty remote development environment and create files or clone a git repository afterwards',
      tags: ['Empty'],
      icon: '/images/empty.svg',
      links: {
        v2: '/devfiles/empty.yaml',
      },
    },
  ];

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('resolve registry metadata', () => {
    it('should call "/dashboard/api/data/resolver"', async () => {
      mockPost.mockResolvedValueOnce({
        data: metaData,
      });
      const data = await getDataResolver(registryLocation);

      expect(mockPost).toBeCalledWith('/dashboard/api/data/resolver', {
        url: 'http://127.0.0.1:8080/dashboard/devfile-registry/devfiles/index.json',
      });
      expect(data).toEqual(metaData);
    });

    it('should return an error message', async () => {
      mockPost.mockRejectedValueOnce({
        code: '500',
        message: 'Something unexpected happened.',
      } as AxiosError);
      let errorMessage: string | undefined;
      try {
        await getDataResolver(registryLocation);
      } catch (err) {
        errorMessage = common.helpers.errors.getMessage(err);
      }

      expect(errorMessage).toEqual('Failed to resolve data. Something unexpected happened.');
    });
  });
});
