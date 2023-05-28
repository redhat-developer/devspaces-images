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

/* eslint-disable @typescript-eslint/no-unused-vars */

import { api } from '@eclipse-che/common';
import * as mockClient from '@kubernetes/client-node';
import { CoreV1Api, V1Secret, V1SecretList } from '@kubernetes/client-node';
import { IncomingMessage } from 'http';
import { PersonalAccessTokenService } from '..';
import { DUMMY_TOKEN_DATA, PersonalAccessTokenSecret } from '../helpers';

const mockIsPatSecret = jest.fn();
const mockToToken = jest.fn();
const mockToSecret = jest.fn();
jest.mock('../helpers', () => {
  const originalModule = jest.requireActual('../helpers');

  return {
    ...originalModule,
    isPatSecret: (...args: Parameters<typeof originalModule['isPatSecret']>) =>
      mockIsPatSecret(...args),
    toToken: (...args: Parameters<typeof originalModule['toToken']>) => mockToToken(),
    toSecret: (...args: Parameters<typeof originalModule['toSecret']>) => mockToSecret(...args),
  };
});
jest.mock('../../helpers/retryableExec');

const namespace = 'user-che';

describe('Personal Access Token API', () => {
  let personalAccessTokenService: PersonalAccessTokenService;

  const stubCoreV1Api = {
    listNamespacedSecret: () => {
      return Promise.resolve({
        body: {
          apiVersion: 'workspace.devfile.io/v1alpha2',
          items: [{} as V1Secret, {} as V1Secret],
          kind: 'SecretList',
          metadata: {
            resourceVersion: '12345',
          },
        },
      });
    },
    createNamespacedSecret: () => {
      return Promise.resolve({
        body: {} as V1Secret,
        response: {} as IncomingMessage,
      });
    },
    readNamespacedSecret: () => {
      return Promise.resolve({
        body: {} as V1Secret,
        response: {} as IncomingMessage,
      });
    },
    replaceNamespacedSecret: () => {
      return Promise.resolve({
        body: {} as V1Secret,
        response: {} as IncomingMessage,
      });
    },
    deleteNamespacedSecret: () => {
      return Promise.resolve({
        body: undefined,
        response: {} as IncomingMessage,
      });
    },
  } as unknown as CoreV1Api;
  const spyListNamespacedSecret = jest.spyOn(stubCoreV1Api, 'listNamespacedSecret');
  const spyCreateNamespacedSecret = jest.spyOn(stubCoreV1Api, 'createNamespacedSecret');
  const spyReadNamespacedSecret = jest.spyOn(stubCoreV1Api, 'readNamespacedSecret');
  const spyReplaceNamespacedSecret = jest.spyOn(stubCoreV1Api, 'replaceNamespacedSecret');
  const spyDeleteNamespacedSecret = jest.spyOn(stubCoreV1Api, 'deleteNamespacedSecret');

  beforeEach(() => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();
    kubeConfig.makeApiClient = jest.fn().mockImplementation(_api => stubCoreV1Api);

    personalAccessTokenService = new PersonalAccessTokenService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listing PAT secrets', () => {
    it('should list secrets', async () => {
      mockIsPatSecret.mockReturnValueOnce(false);
      mockIsPatSecret.mockReturnValueOnce(true);

      const resp = await personalAccessTokenService.listInNamespace(namespace);

      // only one PAT secret is returned
      expect(resp.length).toEqual(1);

      expect(spyListNamespacedSecret).toHaveBeenCalledWith(
        namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        'app.kubernetes.io/component=scm-personal-access-token,app.kubernetes.io/part-of=che.eclipse.org',
      );
    });

    it('should return error', async done => {
      spyListNamespacedSecret.mockImplementationOnce(() => {
        throw new Error('Conflict');
      });

      try {
        await personalAccessTokenService.listInNamespace(namespace);
        done.fail('should have thrown an error');
      } catch (e) {
        expect((e as unknown as Error).message).toEqual(
          `Unable to list personal access tokens in the namespace "${namespace}": Conflict`,
        );
        done();
      }
    });
  });

  describe('adding PAT secret', () => {
    it('should create PAT secret', async () => {
      const token = {
        tokenName: 'asdf-1234',
        tokenData: 'token-data',
      } as api.PersonalAccessToken;

      await personalAccessTokenService.create(namespace, token);

      expect(spyCreateNamespacedSecret).toHaveBeenCalled();
    });

    it('should return error if token already exists', async done => {
      const token = {
        tokenName: 'asdf-1234',
        tokenData: 'token-data',
      } as api.PersonalAccessToken;

      spyListNamespacedSecret.mockImplementationOnce(() => {
        return Promise.resolve({
          response: {} as IncomingMessage,
          body: {
            items: [
              {
                metadata: {
                  name: `personal-access-token-${token.tokenName}`,
                },
              } as V1Secret,
            ],
          } as V1SecretList,
        });
      });

      try {
        await personalAccessTokenService.create(namespace, token);
        done.fail('should have thrown an error');
      } catch (e) {
        expect((e as unknown as Error).message).toEqual(
          `Unable to add personal access token "${token.tokenName}": Token already exists`,
        );
      }
      done();
    });

    it('should return error if token contains the dummy data', async done => {
      const errorMessage = 'Token is not defined';
      mockToSecret.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const token = {
        tokenName: 'asdf-1234',
        tokenData: DUMMY_TOKEN_DATA,
      } as api.PersonalAccessToken;

      try {
        await personalAccessTokenService.create(namespace, token);
        done.fail('should have thrown an error');
      } catch (e) {
        expect((e as unknown as Error).message).toEqual(
          `Unable to add personal access token "${token.tokenName}": ${errorMessage}`,
        );
      }
      done();
    });
  });

  describe('updating PAT secret', () => {
    it('should return error if secret not found', async done => {
      spyReadNamespacedSecret.mockImplementationOnce(() => {
        throw new Error('Not Found');
      });

      const token = {
        tokenName: 'asdf-1234',
        tokenData: 'token-data',
      } as api.PersonalAccessToken;

      try {
        await personalAccessTokenService.replace(namespace, token);
        done.fail('should have thrown an error');
      } catch (e) {
        expect((e as unknown as Error).message).toEqual(
          `Unable to find personal access token "${token.tokenName}" in the namespace "${namespace}": Not Found`,
        );
      }

      done();
    });

    it('should return error if unable to replace the secret', async done => {
      const errorMessage = 'Conflict';
      spyReplaceNamespacedSecret.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const token = {
        tokenName: 'asdf-1234',
        tokenData: 'token-data',
      } as api.PersonalAccessToken;

      try {
        await personalAccessTokenService.replace(namespace, token);
        done.fail('should have thrown an error');
      } catch (e) {
        expect((e as unknown as Error).message).toEqual(
          `Unable to replace personal access token "${token.tokenName}" in the namespace "${namespace}": ${errorMessage}`,
        );
      }

      done();
    });

    it('should replace token with new data', async () => {
      const token = {
        tokenName: 'asdf-1234',
        tokenData: 'new-token-data',
      } as api.PersonalAccessToken;

      await personalAccessTokenService.replace(namespace, token);

      expect(spyReadNamespacedSecret).toHaveBeenCalledTimes(1);

      expect(spyReplaceNamespacedSecret).toHaveBeenCalledTimes(1);
      expect(mockToSecret).toHaveBeenCalledTimes(1);
      expect(mockToSecret).toHaveBeenCalledWith(namespace, { ...token });
    });

    it('should replace token with keeping existing data', async () => {
      spyReadNamespacedSecret.mockImplementationOnce(() => {
        return Promise.resolve({
          body: {
            data: {
              token: 'token-data',
            },
          } as V1Secret,
          response: {} as IncomingMessage,
        });
      });

      const token = {
        tokenName: 'asdf-1234',
        tokenData: DUMMY_TOKEN_DATA,
      } as api.PersonalAccessToken;

      await personalAccessTokenService.replace(namespace, token);

      expect(spyReadNamespacedSecret).toHaveBeenCalledTimes(1);

      expect(spyReplaceNamespacedSecret).toHaveBeenCalledTimes(1);
      expect(mockToSecret).toHaveBeenCalledTimes(1);
      expect(mockToSecret).toHaveBeenCalledWith(namespace, {
        tokenName: token.tokenName,
        tokenData: 'token-data',
      });
    });
  });

  describe('deleting PAT secret', () => {
    it('should delete token', async () => {
      const tokenName = 'asdf-1234';
      await personalAccessTokenService.delete(namespace, tokenName);

      expect(spyDeleteNamespacedSecret).toHaveBeenCalledTimes(1);
    });

    it('should return error if unable to delete the secret', async done => {
      const errorMessage = 'Conflict';
      spyDeleteNamespacedSecret.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const tokenName = 'asdf-1234';

      try {
        await personalAccessTokenService.delete(namespace, tokenName);
        done.fail('should have thrown an error');
      } catch (e) {
        expect((e as unknown as Error).message).toEqual(
          `Unable to delete personal access token "${tokenName}" in the namespace "${namespace}": ${errorMessage}`,
        );
      }

      done();
    });
  });
});
