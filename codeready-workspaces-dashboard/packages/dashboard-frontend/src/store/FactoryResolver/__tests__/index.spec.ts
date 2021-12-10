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

const cheWorkspaceClient = container.get(CheWorkspaceClient);
jest
  .spyOn(cheWorkspaceClient.restApiClient, 'provisionKubernetesNamespace')
  .mockResolvedValue({} as KubernetesNamespace);

describe('FactoryResolver store', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('actions', () => {
    it('should create REQUEST_FACTORY_RESOLVER and RECEIVE_FACTORY_RESOLVER', async () => {
      const resolver: factoryResolverStore.ResolverState = {
        devfile: {
          schemaVersion: '2.0.0',
        } as devfileApi.Devfile,
      };

      const getFactoryResolverSpy = jest
        .spyOn(cheWorkspaceClient.restApiClient, 'getFactoryResolver')
        .mockResolvedValue(resolver);

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
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
        },
      ];
      expect(actions).toEqual(expectedActions);

      getFactoryResolverSpy.mockRestore();
    });

    it('should create REQUEST_FACTORY_RESOLVER and RECEIVE_FACTORY_RESOLVER_ERROR', async () => {
      const spyGetFactoryResolver = jest
        .spyOn(cheWorkspaceClient.restApiClient, 'getFactoryResolver')
        .mockRejectedValue({
          isAxiosError: true,
          code: '500',
          response: {
            data: {
              message: 'Something unexpected happened.',
            },
          },
        } as AxiosError);
      // mute the error outputs
      console.error = jest.fn();

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

      const spyIsAxiosError = jest
        .spyOn(common.helpers.errors, 'isAxiosError')
        .mockImplementation(() => true);
      const spyIsAxiosResponse = jest
        .spyOn(common.helpers.errors, 'isAxiosResponse')
        .mockImplementation(() => true);

      const location = 'factory-link';
      await expect(
        store.dispatch(factoryResolverStore.actionCreators.requestFactoryResolver(location)),
      ).rejects.toMatch('Failed to request factory resolver');
      expect(actions).toEqual(expectedActions);

      spyGetFactoryResolver.mockRestore();
      spyIsAxiosError.mockRestore();
      spyIsAxiosResponse.mockRestore();
    });

    it('should throw if it resolves no devfile', async () => {
      const resolver = {} as factoryResolverStore.ResolverState;

      const spyGetFactoryResolver = jest
        .spyOn(cheWorkspaceClient.restApiClient, 'getFactoryResolver')
        .mockResolvedValue(resolver);

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

      spyGetFactoryResolver.mockRestore();
    });

    it('should reject if authentication is needed', async () => {
      const spyGetFactoryResolver = jest
        .spyOn(cheWorkspaceClient.restApiClient, 'getFactoryResolver')
        .mockRejectedValue({
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

      const spyIsAxiosError = jest
        .spyOn(common.helpers.errors, 'isAxiosError')
        .mockReturnValue(true);
      const spyIsAxiosResponse = jest
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

      spyGetFactoryResolver.mockRestore();
      spyIsAxiosError.mockRestore();
      spyIsAxiosResponse.mockRestore();
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
      const resolver: factoryResolverStore.ResolverState = {
        devfile: {
          schemaVersion: '2.0.0',
        } as devfileApi.Devfile,
      };
      const incomingAction: factoryResolverStore.KnownAction = {
        type: 'RECEIVE_FACTORY_RESOLVER',
        resolver,
      };

      const newState = factoryResolverStore.reducer(initialState, incomingAction);
      const expectedState: factoryResolverStore.State = {
        isLoading: false,
        resolver,
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
