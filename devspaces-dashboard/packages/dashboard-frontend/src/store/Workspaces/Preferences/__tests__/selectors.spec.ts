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

import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import {
  selectPreferences,
  selectPreferencesError,
  selectPreferencesIsTrustedSource,
  selectPreferencesSkipAuthorization,
  selectPreferencesTrustedSources,
} from '@/store/Workspaces/Preferences/selectors';

describe('Workspace preferences, selectors', () => {
  const mockState = {
    preferences: {
      'skip-authorisation': ['github'] as api.GitProvider[],
      'trusted-sources': ['source1', 'source2'],
    },
    error: 'Some error',
  };
  const store = new FakeStoreBuilder()
    .withWorkspacePreferences({
      'skip-authorisation': mockState.preferences['skip-authorisation'],
      'trusted-sources': mockState.preferences['trusted-sources'],
      error: mockState.error,
    })
    .build();

  it('should select preferences', () => {
    const state = store.getState();
    const result = selectPreferences(state);

    expect(result).toEqual(mockState.preferences);
  });

  it('should select preferences error', () => {
    const state = store.getState();
    const result = selectPreferencesError(state);

    expect(result).toEqual(mockState.error);
  });

  it('should select skip-authorization preference', () => {
    const state = store.getState();
    const result = selectPreferencesSkipAuthorization(state);

    expect(result).toEqual(mockState.preferences['skip-authorisation']);
  });

  it('should select trusted sources preference', () => {
    const state = store.getState();
    const result = selectPreferencesTrustedSources(state);

    expect(result).toEqual(mockState.preferences['trusted-sources']);
  });

  describe('check if a location is a trusted source', () => {
    it('some sources are trusted', () => {
      const store = new FakeStoreBuilder()
        .withWorkspacePreferences({
          'skip-authorisation': mockState.preferences['skip-authorisation'],
          'trusted-sources': ['source1'],
          error: mockState.error,
        })
        .build();
      const state = store.getState();
      const result = selectPreferencesIsTrustedSource(state);

      expect(result('source1')).toBeTruthy();
      expect(result('source2')).toBeFalsy();
    });

    it('all sources are trusted', () => {
      const store = new FakeStoreBuilder()
        .withWorkspacePreferences({
          'skip-authorisation': mockState.preferences['skip-authorisation'],
          'trusted-sources': '*',
          error: mockState.error,
        })
        .build();
      const state = store.getState();

      selectPreferences(state);
      const result = selectPreferencesIsTrustedSource(state);

      expect(result('any-source')).toBeTruthy();
    });

    it('no sources are trusted', () => {
      const store = new FakeStoreBuilder()
        .withWorkspacePreferences({
          'skip-authorisation': mockState.preferences['skip-authorisation'],
          'trusted-sources': undefined,
          error: mockState.error,
        })
        .build();
      const state = store.getState();

      const result = selectPreferencesIsTrustedSource(state);

      expect(result('any-source')).toBeFalsy();
    });
  });
});
