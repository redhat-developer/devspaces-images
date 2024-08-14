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
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';
import { actionCreators } from '@/store/Workspaces/Preferences/actions';
import { KnownAction } from '@/store/Workspaces/Preferences/types';

const mockIsTrustedRepo = jest.fn();
jest.mock('@/store/Workspaces/Preferences/helpers', () => ({
  isTrustedRepo: () => mockIsTrustedRepo,
}));

const mockGetWorkspacePreferences = jest.fn().mockResolvedValue({
  'skip-authorisation': [],
  'trusted-sources': '*',
} as api.IWorkspacePreferences);
const mockAddTrustedSource = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/backend-client/workspacePreferencesApi', () => ({
  getWorkspacePreferences: (...args: unknown[]) => mockGetWorkspacePreferences(...args),
  addTrustedSource: (...args: unknown[]) => mockAddTrustedSource(...args),
}));

const mockSelectAsyncIsAuthorized = jest.fn().mockResolvedValue(true);
const mockSelectSanityCheckError = jest.fn().mockReturnValue('');
jest.mock('@/store/SanityCheck/selectors', () => ({
  selectAsyncIsAuthorized: () => mockSelectAsyncIsAuthorized(),
  selectSanityCheckError: () => mockSelectSanityCheckError(),
}));

describe('workspace preferences, actionCreators', () => {
  let store: MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, KnownAction>>;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withInfrastructureNamespace([
        {
          name: 'user-che',
          attributes: {
            phase: 'Active',
          },
        },
      ])
      .build();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPreferences', () => {
    it('should dispatch REQUEST_PREFERENCES and RECEIVE_PREFERENCES', async () => {
      await expect(store.dispatch(actionCreators.requestPreferences())).resolves.toBeUndefined();

      expect(mockGetWorkspacePreferences).toHaveBeenCalled();

      const actions = store.getActions();
      const expectedActions = [
        {
          type: 'REQUEST_PREFERENCES',
          check: AUTHORIZED,
        },
        {
          type: 'RECEIVE_PREFERENCES',
          preferences: {
            'skip-authorisation': [],
            'trusted-sources': '*',
          },
        },
      ];
      expect(actions).toEqual(expectedActions);
    });

    it('should dispatch REQUEST_PREFERENCES and ERROR_PREFERENCES when user is not authorized', async () => {
      mockSelectAsyncIsAuthorized.mockResolvedValueOnce(false);
      mockSelectSanityCheckError.mockReturnValueOnce('not authorized');

      await expect(store.dispatch(actionCreators.requestPreferences())).rejects.toEqual(
        new Error('not authorized'),
      );

      expect(mockGetWorkspacePreferences).not.toHaveBeenCalled();

      const actions = store.getActions();
      const expectedActions = [
        {
          type: 'REQUEST_PREFERENCES',
          check: AUTHORIZED,
        },
        {
          type: 'ERROR_PREFERENCES',
          error: 'not authorized',
        },
      ];
      expect(actions).toEqual(expectedActions);
    });

    it('should dispatch REQUEST_PREFERENCES adn ERROR_PREFERENCES when getWorkspacePreferences fails', async () => {
      const error = new Error('unexpected error');
      mockGetWorkspacePreferences.mockRejectedValueOnce(error);

      await expect(store.dispatch(actionCreators.requestPreferences())).rejects.toEqual(error);

      expect(mockGetWorkspacePreferences).toHaveBeenCalled();

      const actions = store.getActions();
      const expectedActions = [
        {
          type: 'REQUEST_PREFERENCES',
          check: AUTHORIZED,
        },
        {
          type: 'ERROR_PREFERENCES',
          error: error.message,
        },
      ];
      expect(actions).toEqual(expectedActions);
    });
  });

  describe('addTrustedSource', () => {
    it('should dispatch REQUEST_PREFERENCES and UPDATE_PREFERENCES', async () => {
      const sourceUrl = 'https://github.com/user/repo';
      await expect(
        store.dispatch(actionCreators.addTrustedSource(sourceUrl)),
      ).resolves.toBeUndefined();

      expect(mockAddTrustedSource).toHaveBeenCalledWith('user-che', sourceUrl);

      const actions = store.getActions();
      const expectedActions = [
        {
          type: 'REQUEST_PREFERENCES',
          check: AUTHORIZED,
        },
        {
          type: 'UPDATE_PREFERENCES',
        },
        // requestPreferences is called after
        {
          type: 'REQUEST_PREFERENCES',
          check: AUTHORIZED,
        },
        {
          type: 'RECEIVE_PREFERENCES',
          preferences: {
            'skip-authorisation': [],
            'trusted-sources': '*',
          },
        },
      ];
      expect(actions).toEqual(expectedActions);
    });

    it('should dispatch REQUEST_PREFERENCES and ERROR_PREFERENCES when user is not authorized', async () => {
      mockSelectAsyncIsAuthorized.mockResolvedValueOnce(false);
      mockSelectSanityCheckError.mockReturnValueOnce('not authorized');

      const sourceUrl = 'https://github.com/user/repo';
      await expect(store.dispatch(actionCreators.addTrustedSource(sourceUrl))).rejects.toEqual(
        new Error('not authorized'),
      );

      expect(mockAddTrustedSource).not.toHaveBeenCalled();

      const actions = store.getActions();
      const expectedActions = [
        {
          type: 'REQUEST_PREFERENCES',
          check: AUTHORIZED,
        },
        {
          type: 'ERROR_PREFERENCES',
          error: 'not authorized',
        },
      ];
      expect(actions).toEqual(expectedActions);
    });

    it('should dispatch REQUEST_PREFERENCES and ERROR_PREFERENCES when addTrustedSource fails', async () => {
      const error = new Error('unexpected error');
      mockAddTrustedSource.mockRejectedValueOnce(error);

      const sourceUrl = 'https://github.com/user/repo';

      await expect(store.dispatch(actionCreators.addTrustedSource(sourceUrl))).rejects.toEqual(
        error,
      );

      expect(mockAddTrustedSource).toHaveBeenCalledWith('user-che', sourceUrl);

      const actions = store.getActions();
      const expectedActions = [
        {
          type: 'REQUEST_PREFERENCES',
          check: AUTHORIZED,
        },
        {
          type: 'ERROR_PREFERENCES',
          error: error.message,
        },
      ];
      expect(actions).toEqual(expectedActions);
    });
  });
});
