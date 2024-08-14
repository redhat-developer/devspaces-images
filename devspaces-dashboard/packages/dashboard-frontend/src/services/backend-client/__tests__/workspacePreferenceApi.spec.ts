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

import { api } from '@eclipse-che/common';
import mockAxios from 'axios';

import {
  addTrustedSource,
  deleteSkipOauthProvider,
  getWorkspacePreferences,
  removeTrustedSources,
} from '@/services/backend-client/workspacePreferencesApi';

describe('asdf', () => {
  const namespace = 'user-che';
  const mockPreferences = {
    'skip-authorisation': ['github'],
    'trusted-sources': ['source1', 'source2'],
  } as api.IWorkspacePreferences;

  const mockGet = mockAxios.get as jest.Mock;
  const mockPost = mockAxios.post as jest.Mock;
  const mockDelete = mockAxios.delete as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWorkspacePreferences', () => {
    test('request succeeded', async () => {
      mockGet.mockImplementationOnce(() => {
        return Promise.resolve({ data: mockPreferences });
      });

      const result = await getWorkspacePreferences(namespace);

      expect(mockGet).toHaveBeenCalledWith(
        `/dashboard/api/workspace-preferences/namespace/${namespace}`,
        undefined,
      );
      expect(result).toStrictEqual(mockPreferences);
    });

    test('request failed', async () => {
      mockGet.mockImplementationOnce(() => {
        return Promise.reject(new Error('unexpected error'));
      });

      await expect(getWorkspacePreferences(namespace)).rejects.toThrow('unexpected error');
    });
  });

  describe('deleteSkipOauthProvider', () => {
    test('request succeeded', async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      const provider: api.GitProvider = 'azure-devops';
      await deleteSkipOauthProvider(namespace, provider);

      expect(mockDelete).toHaveBeenCalledWith(
        `/dashboard/api/workspace-preferences/namespace/${namespace}/skip-authorisation/${provider}`,
        undefined,
      );
    });

    test('request failed', async () => {
      mockDelete.mockRejectedValueOnce(new Error('unexpected error'));

      const provider: api.GitProvider = 'azure-devops';
      await expect(deleteSkipOauthProvider(namespace, provider)).rejects.toThrow(
        'unexpected error',
      );
    });
  });

  describe('addTrustedSource', () => {
    test('request succeeded', async () => {
      mockPost.mockResolvedValueOnce(undefined);

      const sourceUrl = 'trusted-source';
      await addTrustedSource(namespace, sourceUrl);

      expect(mockPost).toHaveBeenCalledWith(
        `/dashboard/api/workspace-preferences/namespace/${namespace}/trusted-source`,
        { source: sourceUrl },
        undefined,
      );
    });

    test('request failed', async () => {
      mockPost.mockRejectedValueOnce(new Error('unexpected error'));

      const sourceUrl = 'trusted-source';
      await expect(addTrustedSource(namespace, sourceUrl)).rejects.toThrow('unexpected error');
    });
  });

  describe('removeTrustedSources', () => {
    test('request succeeded', async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      await removeTrustedSources(namespace);

      expect(mockDelete).toHaveBeenCalledWith(
        `/dashboard/api/workspace-preferences/namespace/${namespace}/trusted-source`,
        undefined,
      );
    });

    test('request failed', async () => {
      mockDelete.mockRejectedValueOnce(new Error('unexpected error'));

      await expect(removeTrustedSources(namespace)).rejects.toThrow('unexpected error');
    });
  });
});
