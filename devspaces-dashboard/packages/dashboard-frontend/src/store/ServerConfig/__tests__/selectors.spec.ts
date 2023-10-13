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

import { AnyAction } from 'redux';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { serverConfig } from '@/store/ServerConfig/__tests__/stubs';
import {
  selectDashboardLogo,
  selectDefaultComponents,
  selectDefaultEditor,
  selectDefaultPlugins,
  selectOpenVSXUrl,
  selectPluginRegistryInternalUrl,
  selectPluginRegistryUrl,
} from '@/store/ServerConfig/selectors';

describe('serverConfig selectors', () => {
  describe('selectDefaultComponents', () => {
    it('should return provided value', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDwServerConfig(serverConfig)
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const selectedDefaultComponents = selectDefaultComponents(state);
      expect(selectedDefaultComponents).toEqual([
        {
          container: {
            image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
          },
          name: 'universal-developer-image',
        },
      ]);
    });

    it('should return default value', () => {
      const fakeStore = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, AnyAction>
      >;
      const state = fakeStore.getState();

      const selectedDefaultComponents = selectDefaultComponents(state);
      expect(selectedDefaultComponents).toEqual([]);
    });
  });

  describe('selectDefaultEditor', () => {
    it('should return provided value', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDwServerConfig(serverConfig)
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const selectedDefaultEditor = selectDefaultEditor(state);
      expect(selectedDefaultEditor).toEqual('eclipse/theia/next');
    });

    it('should return default value', () => {
      const fakeStore = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, AnyAction>
      >;
      const state = fakeStore.getState();

      const selectedDefaultEditor = selectDefaultEditor(state);
      expect(selectedDefaultEditor).toEqual('che-incubator/che-code/latest');
    });
  });

  describe('selectDefaultPlugins', () => {
    it('should return provided value', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDwServerConfig(serverConfig)
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const selectedDefaultPlugins = selectDefaultPlugins(state);
      expect(selectedDefaultPlugins).toEqual([
        {
          editor: 'eclipse/theia/next',
          plugins: ['https://test.com/devfile.yaml'],
        },
      ]);
    });

    it('should return default value', () => {
      const fakeStore = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, AnyAction>
      >;
      const state = fakeStore.getState();

      const selectedDefaultPlugins = selectDefaultPlugins(state);
      expect(selectedDefaultPlugins).toEqual([]);
    });
  });

  describe('selectPluginRegistryUrl', () => {
    it('should return provided value', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDwServerConfig(serverConfig)
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const selectedPluginRegistryUrl = selectPluginRegistryUrl(state);
      expect(selectedPluginRegistryUrl).toEqual('https://test/plugin-registry/v3');
    });

    it('should return default value', () => {
      const fakeStore = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, AnyAction>
      >;
      const state = fakeStore.getState();

      const selectedPluginRegistryUrl = selectPluginRegistryUrl(state);
      expect(selectedPluginRegistryUrl).toEqual('');
    });
  });

  describe('selectPluginRegistryInternalUrl', () => {
    it('should return provided value', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDwServerConfig(serverConfig)
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const selectedPluginRegistryInternalUrl = selectPluginRegistryInternalUrl(state);
      expect(selectedPluginRegistryInternalUrl).toEqual(
        'http://plugin-registry.eclipse-che.svc:8080/v3',
      );
    });

    it('should return default value', () => {
      const fakeStore = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, AnyAction>
      >;
      const state = fakeStore.getState();

      const selectedPluginRegistryInternalUrl = selectPluginRegistryInternalUrl(state);
      expect(selectedPluginRegistryInternalUrl).toEqual('');
    });
  });

  describe('selectOpenVSXUrl', () => {
    it('should return provided value', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDwServerConfig(serverConfig)
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const selectedOpenVSXUr = selectOpenVSXUrl(state);
      expect(selectedOpenVSXUr).toEqual('https://open-vsx.org');
    });

    it('should return default value', () => {
      const fakeStore = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, AnyAction>
      >;
      const state = fakeStore.getState();

      const selectedOpenVSXUr = selectOpenVSXUrl(state);
      expect(selectedOpenVSXUr).toEqual('');
    });
  });

  describe('selectDashboardLogo', () => {
    it('should return provided value', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDwServerConfig(serverConfig)
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const selectedDashboardLogo = selectDashboardLogo(state);
      expect(selectedDashboardLogo).toEqual({
        base64data: 'base64-encoded-data',
        mediatype: 'image/png',
      });
    });

    it('should return default value', () => {
      const fakeStore = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, AnyAction>
      >;
      const state = fakeStore.getState();

      const selectedDashboardLogo = selectDashboardLogo(state);
      expect(selectedDashboardLogo).toBeUndefined();
    });
  });
});
