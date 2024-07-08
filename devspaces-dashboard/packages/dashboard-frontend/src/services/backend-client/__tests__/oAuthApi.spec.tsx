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

import mockAxios from 'axios';

import {
  deleteOAuthToken,
  getOAuthProviders,
  getOAuthToken,
} from '@/services/backend-client/oAuthApi';
import { IGitOauth } from '@/store/GitOauthConfig/types';

describe('Open Authorization API', () => {
  const mockGet = mockAxios.get as jest.Mock;
  const mockDelete = mockAxios.delete as jest.Mock;

  const oAuthProvider = { name: 'github', endpointUrl: 'https://github.com' } as IGitOauth;
  const oAuthProviderToken = { token: 'dummy_token' };

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('fetch OAuthProviders', () => {
    it('should call "/api/oauth"', async () => {
      mockGet.mockResolvedValueOnce({
        data: expect.anything(),
      });
      await getOAuthProviders();

      expect(mockDelete).not.toHaveBeenCalled();
      expect(mockGet).toHaveBeenCalledWith('/api/oauth');
    });

    it('should return a list of providers', async () => {
      mockGet.mockResolvedValueOnce({
        data: [oAuthProvider],
      });

      const res = await getOAuthProviders();

      expect(res).toEqual([oAuthProvider]);
    });
  });

  describe('fetch OAuthToken', () => {
    it('should call "/api/oauth/token?oauth_provider=github"', async () => {
      mockGet.mockResolvedValueOnce({
        data: expect.anything(),
      });

      await getOAuthToken(oAuthProvider.name);

      expect(mockDelete).not.toHaveBeenCalled();
      expect(mockGet).toHaveBeenCalledWith('/api/oauth/token?oauth_provider=github');
    });

    it('should return the OAuth token', async () => {
      mockGet.mockResolvedValueOnce({
        data: oAuthProviderToken,
      });

      const res = await getOAuthToken(oAuthProvider.name);

      expect(mockDelete).not.toHaveBeenCalled();
      expect(res).toEqual(oAuthProviderToken);
    });
  });

  describe('delete OAuthToken', () => {
    it('should call "/api/oauth/token?oauth_provider=github"', async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      await deleteOAuthToken(oAuthProvider.name);

      expect(mockGet).not.toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith('/api/oauth/token?oauth_provider=github');
    });

    it('should return undefined', async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      const res = await deleteOAuthToken(oAuthProvider.name);

      expect(mockGet).not.toHaveBeenCalled();
      expect(res).toBeUndefined();
    });
  });
});
