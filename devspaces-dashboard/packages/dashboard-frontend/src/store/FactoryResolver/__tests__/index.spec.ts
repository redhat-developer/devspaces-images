/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';
import common from '@eclipse-che/common';
import { AppState } from '../..';
import { FakeStoreBuilder } from '../../__mocks__/storeBuilder';
import devfileApi from '../../../services/devfileApi';
import { container } from '../../../inversify.config';
import { CheWorkspaceClient } from '../../../services/workspace-client/cheworkspace/cheWorkspaceClient';
import * as factoryResolverStore from '..';
import { AxiosError } from 'axios';
import { KubernetesNamespace } from '@eclipse-che/workspace-client/dist/rest/resources';
import normalizeDevfileV1 from '../normalizeDevfileV1';
import normalizeDevfileV2 from '../normalizeDevfileV2';
import {
  convertDevfileV2toDevfileV1,
  convertDevfileV1toDevfileV2,
} from '../../../services/devfile/converters';

jest.mock('../normalizeDevfileV1.ts');
(normalizeDevfileV1 as jest.Mock).mockImplementation(devfile => {
  return devfile;
});
jest.mock('../normalizeDevfileV2.ts');
(normalizeDevfileV2 as jest.Mock).mockImplementation(devfile => {
  return devfile;
});

jest.mock('../../../services/devfile/converters');
(convertDevfileV2toDevfileV1 as jest.Mock).mockImplementation(async () => {
  return {
    apiVersion: '1.0.0',
  } as che.WorkspaceDevfile;
});
(convertDevfileV1toDevfileV2 as jest.Mock).mockImplementation(async () => {
  return {
    schemaVersion: '2.0.0',
  } as devfileApi.Devfile;
});

jest.mock('../../../services/devfileApi');
jest.mock('../../../services/devfileApi/typeguards.ts', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/ban-types
    ...(jest.requireActual('../../../services/devfileApi/typeguards.ts') as Object),
    isDevfileV2: (devfile: unknown): boolean => {
      return (devfile as devfileApi.Devfile).schemaVersion !== undefined;
    },
  };
});

// mute the error outputs
console.error = jest.fn();

const cheWorkspaceClient = container.get(CheWorkspaceClient);
jest
  .spyOn(cheWorkspaceClient.restApiClient, 'provisionKubernetesNamespace')
  .mockResolvedValue({} as KubernetesNamespace);

const getFactoryResolverSpy = jest.spyOn(cheWorkspaceClient.restApiClient, 'getFactoryResolver');

describe('FactoryResolver store', () => {
  describe('requestFactoryResolver action', () => {
    it('should NOT convert resolved devfile v1 with devworkspace mode DISABLED', async () => {
      const resolver = {
        devfile: {
          apiVersion: '1.0.0',
        } as che.WorkspaceDevfile,
      } as factoryResolverStore.ResolverState;

      getFactoryResolverSpy.mockResolvedValueOnce(resolver);

      const store = new FakeStoreBuilder()
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'false',
          'che.workspace.storage.preferred_type': 'ephemeral',
        })
        .build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, factoryResolverStore.KnownAction>
      >;

      const location = 'factory-link';
      await store.dispatch(factoryResolverStore.actionCreators.requestFactoryResolver(location));

      const actions = store.getActions();
      expect(actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'RECEIVE_FACTORY_RESOLVER',
            converted: expect.objectContaining({
              isConverted: false,
            }),
          }),
        ]),
      );
    });

    it('should convert resolved devfile v1 with devworkspace mode ENABLED', async () => {
      const resolver = {
        devfile: {
          apiVersion: '1.0.0',
        } as che.WorkspaceDevfile,
      } as factoryResolverStore.ResolverState;

      getFactoryResolverSpy.mockResolvedValueOnce(resolver);

      const store = new FakeStoreBuilder()
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'true',
          'che.workspace.storage.preferred_type': 'ephemeral',
        })
        .build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, factoryResolverStore.KnownAction>
      >;

      const location = 'factory-link';
      await store.dispatch(factoryResolverStore.actionCreators.requestFactoryResolver(location));

      const actions = store.getActions();
      expect(actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'RECEIVE_FACTORY_RESOLVER',
            converted: expect.objectContaining({
              isConverted: true,
            }),
          }),
        ]),
      );
    });

    it('should NOT convert resolved devfile v2.x.x with devworkspace mode ENABLED', async () => {
      const resolver = {
        devfile: {
          schemaVersion: '2.0.0',
        } as devfileApi.Devfile,
      } as factoryResolverStore.ResolverState;

      getFactoryResolverSpy.mockResolvedValueOnce(resolver);

      const store = new FakeStoreBuilder()
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'true',
          'che.workspace.storage.preferred_type': 'ephemeral',
        })
        .build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, factoryResolverStore.KnownAction>
      >;

      const location = 'factory-link';
      await store.dispatch(factoryResolverStore.actionCreators.requestFactoryResolver(location));

      const actions = store.getActions();
      expect(actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'RECEIVE_FACTORY_RESOLVER',
            converted: expect.objectContaining({
              isConverted: false,
            }),
          }),
        ]),
      );
    });

    it('should convert resolved devfile v2.x.x with devworkspace mode DISABLED', async () => {
      const resolver = {
        devfile: {
          schemaVersion: '2.0.0',
        } as devfileApi.Devfile,
      } as factoryResolverStore.ResolverState;

      getFactoryResolverSpy.mockResolvedValueOnce(resolver);

      const store = new FakeStoreBuilder()
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'false',
          'che.workspace.storage.preferred_type': 'ephemeral',
        })
        .build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, factoryResolverStore.KnownAction>
      >;

      const location = 'factory-link';
      await store.dispatch(factoryResolverStore.actionCreators.requestFactoryResolver(location));

      const actions = store.getActions();
      expect(actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'RECEIVE_FACTORY_RESOLVER',
            converted: expect.objectContaining({
              isConverted: true,
            }),
          }),
        ]),
      );
    });
  });

  describe('actions', () => {
    it('should create REQUEST_FACTORY_RESOLVER and RECEIVE_FACTORY_RESOLVER', async () => {
      const resolver = {
        devfile: {
          apiVersion: '1.0.0',
        } as che.WorkspaceDevfile,
      } as factoryResolverStore.ResolverState;

      getFactoryResolverSpy.mockResolvedValueOnce(resolver);

      const store = new FakeStoreBuilder()
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'false',
          'che.workspace.storage.preferred_type': 'ephemeral',
        })
        .build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, factoryResolverStore.KnownAction>
      >;

      const location = 'factory-link';
      await store.dispatch(factoryResolverStore.actionCreators.requestFactoryResolver(location));

      const actions = store.getActions();
      const expectedActions: factoryResolverStore.KnownAction[] = [
        {
          type: 'REQUEST_FACTORY_RESOLVER',
        },
        {
          type: 'RECEIVE_FACTORY_RESOLVER',
          resolver: expect.objectContaining(resolver),
          converted: expect.objectContaining({ isConverted: false }),
        },
      ];
      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_FACTORY_RESOLVER and RECEIVE_FACTORY_RESOLVER_ERROR', async () => {
      getFactoryResolverSpy.mockRejectedValueOnce({
        isAxiosError: true,
        code: '500',
        response: {
          data: {
            message: 'Something unexpected happened.',
          },
        },
      } as AxiosError);

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, factoryResolverStore.KnownAction>
      >;

      const actions = store.getActions();
      const expectedActions: factoryResolverStore.KnownAction[] = [
        {
          type: 'REQUEST_FACTORY_RESOLVER',
        },
        {
          type: 'RECEIVE_FACTORY_RESOLVER_ERROR',
          error: expect.stringContaining('Failed to request factory resolver'),
        },
      ];

      const isAxiosErrorMock = jest
        .spyOn(common.helpers.errors, 'isAxiosError')
        .mockImplementation(() => true);
      const isAxiosResponseMock = jest
        .spyOn(common.helpers.errors, 'isAxiosResponse')
        .mockImplementation(() => true);

      const location = 'factory-link';
      await expect(
        store.dispatch(factoryResolverStore.actionCreators.requestFactoryResolver(location)),
      ).rejects.toMatch('Failed to request factory resolver');
      expect(actions).toEqual(expectedActions);

      isAxiosErrorMock.mockRestore();
      isAxiosResponseMock.mockRestore();
    });

    it('should throw if it resolves no devfile', async () => {
      const resolver = {} as factoryResolverStore.ResolverState;

      getFactoryResolverSpy.mockResolvedValueOnce(resolver);

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, factoryResolverStore.KnownAction>
      >;

      const actions = store.getActions();
      const expectedActions: factoryResolverStore.KnownAction[] = [
        {
          type: 'REQUEST_FACTORY_RESOLVER',
        },
        {
          type: 'RECEIVE_FACTORY_RESOLVER_ERROR',
          error: expect.stringContaining('The specified link does not contain a valid Devfile.'),
        },
      ];

      const location = 'factory-link';
      await expect(
        store.dispatch(factoryResolverStore.actionCreators.requestFactoryResolver(location)),
      ).rejects.toMatch('The specified link does not contain a valid Devfile.');
      expect(actions).toEqual(expectedActions);
    });

    it('should reject if authentication is needed', async () => {
      getFactoryResolverSpy.mockRejectedValueOnce({
        isAxiosError: true,
        code: '401',
        response: {
          headers: {},
          status: 401,
          statusText: 'Unauthorized',
          config: {},
          data: {
            attributes: {
              oauth_provider: 'oauth_provider',
              oauth_authentication_url: 'oauth_authentication_url',
            },
          },
        },
      } as AxiosError);

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, factoryResolverStore.KnownAction>
      >;

      const isAxiosErrorMock = jest
        .spyOn(common.helpers.errors, 'isAxiosError')
        .mockReturnValue(true);
      const isAxiosResponseMock = jest
        .spyOn(common.helpers.errors, 'isAxiosResponse')
        .mockReturnValue(true);

      const location = 'factory-link';
      await expect(
        store.dispatch(factoryResolverStore.actionCreators.requestFactoryResolver(location)),
      ).rejects.toEqual({
        attributes: {
          oauth_provider: 'oauth_provider',
          oauth_authentication_url: 'oauth_authentication_url',
        },
      });

      isAxiosErrorMock.mockRestore();
      isAxiosResponseMock.mockRestore();
    });
  });

  describe('reducers', () => {
    it('should return initial state', () => {
      const incomingAction: factoryResolverStore.KnownAction = {
        type: 'REQUEST_FACTORY_RESOLVER',
      };

      const initialState = factoryResolverStore.reducer(undefined, incomingAction);
      const expectedState: factoryResolverStore.State = {
        isLoading: false,
      };

      expect(initialState).toEqual(expectedState);
    });

    it('should return state if action is not matched', () => {
      const initialState: factoryResolverStore.State = {
        isLoading: true,
      };
      const incomingAction = {
        type: 'OTHER_ACTION',
      };

      const newState = factoryResolverStore.reducer(initialState, incomingAction);
      const expectedState: factoryResolverStore.State = {
        isLoading: true,
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle REQUEST_FACTORY_RESOLVER', () => {
      const initialState: factoryResolverStore.State = {
        isLoading: false,
      };
      const incomingAction: factoryResolverStore.KnownAction = {
        type: 'REQUEST_FACTORY_RESOLVER',
      };

      const newState = factoryResolverStore.reducer(initialState, incomingAction);
      const expectedState: factoryResolverStore.State = {
        isLoading: true,
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_FACTORY_RESOLVER', () => {
      const initialState: factoryResolverStore.State = {
        isLoading: true,
      };
      const resolver = {
        devfile: {
          schemaVersion: '2.0.0',
        } as devfileApi.Devfile,
      } as factoryResolverStore.ResolverState;
      const converted: factoryResolverStore.ConvertedState = {
        isConverted: false,
      } as any;
      const incomingAction: factoryResolverStore.KnownAction = {
        type: 'RECEIVE_FACTORY_RESOLVER',
        resolver,
        converted,
      };

      const newState = factoryResolverStore.reducer(initialState, incomingAction);
      const expectedState: factoryResolverStore.State = {
        isLoading: false,
        resolver,
        converted,
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_FACTORY_RESOLVER_ERROR', () => {
      const initialState: factoryResolverStore.State = {
        isLoading: true,
      };
      const incomingAction: factoryResolverStore.KnownAction = {
        type: 'RECEIVE_FACTORY_RESOLVER_ERROR',
        error: 'Unexpected error',
      };

      const newState = factoryResolverStore.reducer(initialState, incomingAction);
      const expectedState: factoryResolverStore.State = {
        isLoading: false,
        error: 'Unexpected error',
      };

      expect(newState).toEqual(expectedState);
    });
  });
});
