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

import { AxiosError } from 'axios';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import * as factoryResolver from '@/services/backend-client/factoryApi';
import * as yamlResolver from '@/services/backend-client/yamlResolverApi';
import devfileApi from '@/services/devfileApi';
import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { actionCreators } from '@/store/FactoryResolver/actions';
import { normalizeDevfile } from '@/store/FactoryResolver/helpers';
import { KnownAction, Resolver, Type } from '@/store/FactoryResolver/types';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';

const mockGrabLink = jest.fn().mockResolvedValue(undefined);
const mockIsDevfileRegistryLocation = jest.fn().mockReturnValue(false);
const mockNormalizeDevfile = jest
  .fn()
  .mockImplementation((...args: Parameters<typeof normalizeDevfile>) => args[0].devfile);
jest.mock('@/store/FactoryResolver/helpers.ts', () => {
  return {
    grabLink: (...args: unknown[]) => mockGrabLink(...args),
    isDevfileRegistryLocation: (...args: unknown[]) => mockIsDevfileRegistryLocation(...args),
    normalizeDevfile: (...args: unknown[]) => mockNormalizeDevfile(...args),
  };
});

jest.mock('@/services/devfileApi');
jest.mock('@/services/devfileApi/typeguards', () => {
  return {
    ...jest.requireActual('@/services/devfileApi/typeguards'),
    isDevfileV2: (devfile: unknown): boolean => {
      return (devfile as devfileApi.Devfile).schemaVersion !== undefined;
    },
  };
});

const getFactoryResolverSpy = jest.spyOn(factoryResolver, 'getFactoryResolver');
const getYamlResolverSpy = jest.spyOn(yamlResolver, 'getYamlResolver');

describe('FactoryResolver store, actions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let store: MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, KnownAction>>;

  beforeEach(() => {
    store = new FakeStoreBuilder().build();
  });

  it('should create REQUEST_FACTORY_RESOLVER and RECEIVE_FACTORY_RESOLVER_ERROR if factory resolver fails', async () => {
    getFactoryResolverSpy.mockRejectedValueOnce({
      isAxiosError: true,
      code: '500',
      response: {
        data: {
          message: 'Something unexpected happened.',
        },
      },
    } as AxiosError);

    const location = 'http://factory-link';
    await expect(
      store.dispatch(actionCreators.requestFactoryResolver(location, {})),
    ).rejects.toEqual(
      'Unexpected error. Check DevTools console and network tabs for more information.',
    );

    const actions = store.getActions();
    const expectedActions: KnownAction[] = [
      {
        type: Type.REQUEST_FACTORY_RESOLVER,
        check: AUTHORIZED,
      },
      {
        type: Type.RECEIVE_FACTORY_RESOLVER_ERROR,
        error: expect.stringContaining('Unexpected error'),
      },
    ];

    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_FACTORY_RESOLVER and RECEIVE_FACTORY_RESOLVER_ERROR if resolver returns no devfile', async () => {
    getFactoryResolverSpy.mockResolvedValueOnce({
      devfile: undefined,
    });

    const location = 'http://factory-link';
    await expect(
      store.dispatch(actionCreators.requestFactoryResolver(location, {})),
    ).rejects.toEqual('The specified link does not contain any Devfile.');

    const actions = store.getActions();
    const expectedActions: KnownAction[] = [
      {
        type: Type.REQUEST_FACTORY_RESOLVER,
        check: AUTHORIZED,
      },
      {
        error: 'The specified link does not contain any Devfile.',
        type: Type.RECEIVE_FACTORY_RESOLVER_ERROR,
      },
    ];

    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_FACTORY_RESOLVER if authentication is needed', async () => {
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

    const location = 'http://factory-link';
    await expect(
      store.dispatch(actionCreators.requestFactoryResolver(location, {})),
    ).rejects.toStrictEqual({
      attributes: {
        oauth_provider: 'oauth_provider',
        oauth_authentication_url: 'oauth_authentication_url',
      },
    });

    const actions = store.getActions();
    const expectedActions: KnownAction[] = [
      {
        type: Type.REQUEST_FACTORY_RESOLVER,
        check: AUTHORIZED,
      },
    ];

    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_FACTORY_RESOLVER and RECEIVE_FACTORY_RESOLVER', async () => {
    const devfile = {
      schemaVersion: '2.0.0',
    } as devfileApi.Devfile;
    getFactoryResolverSpy.mockResolvedValueOnce({
      devfile,
    });

    const location = 'http://factory-link';
    await expect(
      store.dispatch(actionCreators.requestFactoryResolver(location, {})),
    ).resolves.toBeUndefined();

    const actions = store.getActions();
    const expectedActions: KnownAction[] = [
      {
        type: Type.REQUEST_FACTORY_RESOLVER,
        check: AUTHORIZED,
      },
      {
        resolver: {
          devfile,
          location,
          optionalFilesContent: {},
        },
        type: Type.RECEIVE_FACTORY_RESOLVER,
      },
    ];

    expect(actions).toEqual(expectedActions);
  });

  describe('check resolver types', () => {
    const resolver = {
      devfile: {
        schemaVersion: '2.0.0',
      } as devfileApi.Devfile,
    } as Resolver;

    beforeEach(() => {
      getFactoryResolverSpy.mockResolvedValueOnce(resolver);
      getYamlResolverSpy.mockResolvedValueOnce(resolver);
    });

    it('should call the yaml resolver for a devfile registry', async () => {
      const location = 'http://registry/devfile.yaml';

      mockIsDevfileRegistryLocation.mockReturnValueOnce(true);

      await expect(
        store.dispatch(actionCreators.requestFactoryResolver(location, {})),
      ).resolves.toBeUndefined();

      expect(getYamlResolverSpy).toHaveBeenCalledWith(location);
      expect(getFactoryResolverSpy).not.toHaveBeenCalled();
    });

    it('should call the factory resolver for non-registry devfiles', async () => {
      const location = 'https://github.com/eclipse-che/che-dashboard.git';

      mockIsDevfileRegistryLocation.mockReturnValueOnce(false);

      await expect(
        store.dispatch(actionCreators.requestFactoryResolver(location, {})),
      ).resolves.toBeUndefined();

      expect(getYamlResolverSpy).not.toHaveBeenCalledWith();
      expect(getFactoryResolverSpy).toHaveBeenCalledWith(location, {
        error_code: undefined,
      });
    });
  });
});
