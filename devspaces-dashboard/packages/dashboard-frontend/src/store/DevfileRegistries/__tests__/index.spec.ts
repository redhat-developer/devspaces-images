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
import { AnyAction } from 'redux';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';

import * as devfileRegistriesStore from '..';

// mute error outputs
console.error = jest.fn();

describe('Devfile registries', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actions', () => {
    it('should create REQUEST_REGISTRY_METADATA, RECEIVE_REGISTRY_METADATA when fetching registries', async () => {
      const registryMetadataV1 = getMetadataV1();
      const registryMetadataV2 = getMetadataV2();
      (mockAxios.get as jest.Mock)
        .mockResolvedValueOnce({
          data: registryMetadataV1,
        })
        .mockResolvedValueOnce({
          data: registryMetadataV2,
        })
        .mockResolvedValue({
          data: [],
        });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, devfileRegistriesStore.KnownAction>
      >;

      const location1 = 'http://example.com/location1';
      const location2 = 'http://example.com/location2';
      const location3 = 'http://example.com/location3';
      const locations = `${location1} ${location2} ${location3}`;
      await store.dispatch(
        devfileRegistriesStore.actionCreators.requestRegistriesMetadata(locations, false),
      );

      const actions = store.getActions();

      const expectedActions: devfileRegistriesStore.KnownAction[] = [
        {
          type: devfileRegistriesStore.Type.REQUEST_REGISTRY_METADATA,
          check: AUTHORIZED,
        },
        {
          type: devfileRegistriesStore.Type.REQUEST_REGISTRY_METADATA,
          check: AUTHORIZED,
        },
        {
          type: devfileRegistriesStore.Type.REQUEST_REGISTRY_METADATA,
          check: AUTHORIZED,
        },
        {
          type: devfileRegistriesStore.Type.RECEIVE_REGISTRY_METADATA,
          url: location1,
          metadata: expect.arrayContaining([
            expect.objectContaining({ displayName: registryMetadataV1[0].displayName }),
          ]),
        },
        {
          type: devfileRegistriesStore.Type.RECEIVE_REGISTRY_METADATA,
          url: location2,
          metadata: expect.arrayContaining([
            expect.objectContaining({ displayName: registryMetadataV2[0].displayName }),
          ]),
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_REGISTRY_METADATA and RECEIVE_REGISTRY_ERROR when failed to fetch a registry', async () => {
      const registryMetadataV1 = getMetadataV1();
      const registryMetadataV2 = getMetadataV2();
      (mockAxios.get as jest.Mock)
        .mockResolvedValueOnce({
          data: registryMetadataV1,
        })
        .mockResolvedValueOnce({
          data: registryMetadataV2,
        })
        .mockRejectedValueOnce({
          data: undefined,
        });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, devfileRegistriesStore.KnownAction>
      >;

      const location1 = 'http://example.com/location1';
      const location2 = 'http://example.com/location2';
      const location3 = 'http://example.com/location3';
      const locations = `${location1} ${location2} ${location3}`;

      await expect(
        store.dispatch(
          devfileRegistriesStore.actionCreators.requestRegistriesMetadata(locations, false),
        ),
      ).rejects.toMatch(
        'Failed to fetch devfiles metadata from registry URL: http://example.com/location3, reason: Unexpected error. Check DevTools console and network tabs for more information.',
      );

      const actions = store.getActions();

      const expectedActions: devfileRegistriesStore.KnownAction[] = [
        {
          type: devfileRegistriesStore.Type.REQUEST_REGISTRY_METADATA,
          check: AUTHORIZED,
        },
        {
          type: devfileRegistriesStore.Type.REQUEST_REGISTRY_METADATA,
          check: AUTHORIZED,
        },
        {
          type: devfileRegistriesStore.Type.REQUEST_REGISTRY_METADATA,
          check: AUTHORIZED,
        },
        {
          type: devfileRegistriesStore.Type.RECEIVE_REGISTRY_METADATA,
          url: location1,
          metadata: expect.arrayContaining([
            expect.objectContaining({ displayName: registryMetadataV1[0].displayName }),
          ]),
        },
        {
          type: devfileRegistriesStore.Type.RECEIVE_REGISTRY_METADATA,
          url: location2,
          metadata: expect.arrayContaining([
            expect.objectContaining({ displayName: registryMetadataV2[0].displayName }),
          ]),
        },
        {
          type: devfileRegistriesStore.Type.RECEIVE_REGISTRY_ERROR,
          url: location3,
          error: expect.stringContaining(location3),
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_DEVFILE and RECEIVE_DEVFILE when fetching a devfile', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: 'a devfile content',
      });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, devfileRegistriesStore.KnownAction>
      >;

      const devfileUrl = 'http://example.com/devfile.yaml';
      await store.dispatch(devfileRegistriesStore.actionCreators.requestDevfile(devfileUrl));

      const actions = store.getActions();

      const expectedActions: devfileRegistriesStore.KnownAction[] = [
        {
          type: devfileRegistriesStore.Type.REQUEST_DEVFILE,
          check: AUTHORIZED,
        },
        {
          type: devfileRegistriesStore.Type.RECEIVE_DEVFILE,
          url: devfileUrl,
          devfile: 'a devfile content',
        },
      ];

      expect(actions).toEqual(expectedActions);
    });
  });

  describe('reducer', () => {
    it('should return initial state', () => {
      const incomingAction: devfileRegistriesStore.RequestRegistryMetadataAction = {
        type: devfileRegistriesStore.Type.REQUEST_REGISTRY_METADATA,
        check: AUTHORIZED,
      };
      const initialState = devfileRegistriesStore.reducer(undefined, incomingAction);

      const expectedState: devfileRegistriesStore.State = {
        isLoading: false,
        registries: {},
        devfiles: {},
        devWorkspaceResources: {},
        filter: '',
      };

      expect(initialState).toEqual(expectedState);
    });

    it('should return state if action type is not matched', () => {
      const initialState: devfileRegistriesStore.State = {
        isLoading: true,
        registries: {},
        devfiles: {},
        devWorkspaceResources: {},
        filter: '',
      };
      const incomingAction = {
        type: 'OTHER_ACTION',
      } as AnyAction;
      const newState = devfileRegistriesStore.reducer(initialState, incomingAction);

      const expectedState: devfileRegistriesStore.State = {
        isLoading: true,
        registries: {},
        devfiles: {},
        devWorkspaceResources: {},
        filter: '',
      };
      expect(newState).toEqual(expectedState);
    });

    it('should should handle REQUEST_REGISTRY_METADATA', () => {
      const initialState: devfileRegistriesStore.State = {
        isLoading: false,
        registries: {},
        devfiles: {},
        devWorkspaceResources: {},
        filter: '',
      };
      const incomingAction: devfileRegistriesStore.RequestRegistryMetadataAction = {
        type: devfileRegistriesStore.Type.REQUEST_REGISTRY_METADATA,
        check: AUTHORIZED,
      };
      const newState = devfileRegistriesStore.reducer(initialState, incomingAction);

      const expectedState: devfileRegistriesStore.State = {
        isLoading: true,
        registries: {},
        devfiles: {},
        devWorkspaceResources: {},
        filter: '',
      };
      expect(newState).toEqual(expectedState);
    });

    it('should should handle RECEIVE_REGISTRY_METADATA', () => {
      const initialState: devfileRegistriesStore.State = {
        isLoading: true,
        registries: {},
        devfiles: {},
        devWorkspaceResources: {},
        filter: '',
      };
      const url = 'http://example.com/devfiles/registry';
      const metadata = [...getMetadataV1(), ...getMetadataV2()];
      const incomingAction: devfileRegistriesStore.ReceiveRegistryMetadataAction = {
        type: devfileRegistriesStore.Type.RECEIVE_REGISTRY_METADATA,
        url,
        metadata,
      };
      const newState = devfileRegistriesStore.reducer(initialState, incomingAction);

      const expectedState: devfileRegistriesStore.State = {
        isLoading: false,
        registries: {
          [url]: { metadata },
        },
        devfiles: {},
        devWorkspaceResources: {},
        filter: '',
      };
      expect(newState).toEqual(expectedState);
    });

    it('should should handle RECEIVE_REGISTRY_ERROR', () => {
      const initialState: devfileRegistriesStore.State = {
        isLoading: true,
        registries: {},
        devfiles: {},
        devWorkspaceResources: {},
        filter: '',
      };
      const url = 'http://example.com/devfiles/registry';
      const error = 'error message';
      const incomingAction: devfileRegistriesStore.ReceiveRegistryErrorAction = {
        type: devfileRegistriesStore.Type.RECEIVE_REGISTRY_ERROR,
        url,
        error,
      };
      const newState = devfileRegistriesStore.reducer(initialState, incomingAction);

      const expectedState: devfileRegistriesStore.State = {
        isLoading: false,
        registries: {
          [url]: { error },
        },
        devfiles: {},
        devWorkspaceResources: {},
        filter: '',
      };
      expect(newState).toEqual(expectedState);
    });

    it('should should handle REQUEST_DEVFILE', () => {
      const initialState: devfileRegistriesStore.State = {
        isLoading: false,
        registries: {},
        devfiles: {},
        devWorkspaceResources: {},
        filter: '',
      };
      const incomingAction: devfileRegistriesStore.RequestDevfileAction = {
        type: devfileRegistriesStore.Type.REQUEST_DEVFILE,
        check: AUTHORIZED,
      };
      const newState = devfileRegistriesStore.reducer(initialState, incomingAction);

      const expectedState: devfileRegistriesStore.State = {
        isLoading: true,
        registries: {},
        devfiles: {},
        devWorkspaceResources: {},
        filter: '',
      };
      expect(newState).toEqual(expectedState);
    });

    it('should should handle RECEIVE_DEVFILE', () => {
      const initialState: devfileRegistriesStore.State = {
        isLoading: true,
        registries: {},
        devfiles: {},
        devWorkspaceResources: {},
        filter: '',
      };
      const url = 'http://example.com/devfile.yaml';
      const content = 'a devfile content';
      const incomingAction: devfileRegistriesStore.ReceiveDevfileAction = {
        type: devfileRegistriesStore.Type.RECEIVE_DEVFILE,
        url,
        devfile: content,
      };
      const newState = devfileRegistriesStore.reducer(initialState, incomingAction);

      const expectedState: devfileRegistriesStore.State = {
        isLoading: false,
        registries: {},
        devfiles: {
          [url]: { content },
        },
        devWorkspaceResources: {},
        filter: '',
      };
      expect(newState).toEqual(expectedState);
    });
  });
});

function getMetadataV1(): che.DevfileMetaData[] {
  return [
    {
      displayName: 'Java with JBoss EAP XP 3.0 Bootable Jar',
      description: 'Java stack with OpenJDK 11, Maven 3.6.3 and JBoss EAP XP 3.0 Bootable Jar',
      tags: ['Java', 'OpenJDK', 'Maven', 'EAP', 'Microprofile', 'EAP XP', 'Bootable Jar', 'UBI8'],
      icon: '/images/type-jboss.svg',
      links: {
        self: '/devfiles/00_java11-maven-microprofile-bootable/devfile.yaml',
      },
    },
  ];
}
function getMetadataV2(): che.DevfileMetaData[] {
  return [
    {
      displayName: 'Go',
      description: 'Stack with Go 1.14',
      tags: ['Debian', 'Go'],
      icon: '/images/go.svg',
      links: {
        v2: 'https://github.com/che-samples/golang-echo-example/tree/devfile2',
        devWorkspaces: {
          'eclipse/che-theia/latest': '/devfiles/go/devworkspace-che-theia-latest.yaml',
          'eclipse/che-theia/next': '/devfiles/go/devworkspace-che-theia-next.yaml',
        },
        self: '/devfiles/go/devfile.yaml',
      },
    },
  ];
}
