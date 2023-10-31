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

import { SshKeysService } from '..';

const mockIsSshKeySecret = jest.fn();
const mockFromSecret = jest.fn();
const mockToSecret = jest.fn();
jest.mock('../helpers', () => {
  const originalModule = jest.requireActual('../helpers');

  return {
    ...originalModule,
    isSshKeySecret: (...args: Parameters<(typeof originalModule)['isSshKeySecret']>) =>
      mockIsSshKeySecret(...args),
    fromSecret: (...args: Parameters<(typeof originalModule)['fromSecret']>) =>
      mockFromSecret(...args),
    toSecret: (...args: Parameters<(typeof originalModule)['toSecret']>) => mockToSecret(...args),
  };
});
jest.mock('../../helpers/retryableExec');

const namespace = 'user-che';

describe('SSH Keys API', () => {
  let sshKeysService: SshKeysService;

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
    // replaceNamespacedSecret: () => {
    //   return Promise.resolve({
    //     body: {} as V1Secret,
    //     response: {} as IncomingMessage,
    //   });
    // },
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
  // const spyReplaceNamespacedSecret = jest.spyOn(stubCoreV1Api, 'replaceNamespacedSecret');
  const spyDeleteNamespacedSecret = jest.spyOn(stubCoreV1Api, 'deleteNamespacedSecret');

  beforeEach(() => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();
    kubeConfig.makeApiClient = jest.fn().mockImplementation(_api => stubCoreV1Api);

    sshKeysService = new SshKeysService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listing SSH key secrets', () => {
    it('should list secrets', async () => {
      mockIsSshKeySecret.mockReturnValueOnce(false);
      mockIsSshKeySecret.mockReturnValueOnce(true);

      const resp = await sshKeysService.list(namespace);

      // only one SSH key secret is returned
      expect(resp.length).toEqual(1);

      expect(spyListNamespacedSecret).toHaveBeenCalledWith(
        namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        'controller.devfile.io/mount-to-devworkspace=true,controller.devfile.io/watch-secret=true',
      );
    });

    it('should return error', async () => {
      spyListNamespacedSecret.mockImplementationOnce(() => {
        throw new Error('Conflict');
      });

      expect.assertions(1);

      try {
        await sshKeysService.list(namespace);
      } catch (e) {
        expect((e as unknown as Error).message).toEqual(
          `Unable to list SSH keys in the namespace "${namespace}": Conflict`,
        );
      }
    });
  });

  describe('adding SSH key secret', () => {
    it('should create SSH key secret', async () => {
      const sshKey: api.NewSshKey = {
        name: 'asdf-1234',
        key: 'ssh-key-data',
        keyPub: 'ssh-key-pub-data',
      };

      await sshKeysService.add(namespace, sshKey);

      expect(spyCreateNamespacedSecret).toHaveBeenCalled();
    });

    it('should return error if the SSH key already exists', async () => {
      const sshKey: api.NewSshKey = {
        name: 'git-ssh-key',
        key: 'ssh-key-data',
        keyPub: 'ssh-key-pub-data',
      };

      spyListNamespacedSecret.mockImplementationOnce(() => {
        return Promise.resolve({
          response: {} as IncomingMessage,
          body: {
            items: [
              {
                metadata: {
                  name: 'git-ssh-key',
                },
              } as V1Secret,
            ],
          } as V1SecretList,
        });
      });

      expect.assertions(1);

      try {
        await sshKeysService.add(namespace, sshKey);
      } catch (e) {
        expect((e as unknown as Error).message).toEqual(
          `Unable to add SSH key "${sshKey.name}": SSH key already exists`,
        );
      }
    });

    it('should return error if SSH key contains the dummy data', async () => {
      const errorMessage = 'Key is not defined';
      mockToSecret.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const sshKey: api.NewSshKey = {
        name: 'asdf-1234',
        key: 'ssh-key-data',
        keyPub: 'ssh-key-pub-data',
      };

      expect.assertions(1);

      try {
        await sshKeysService.add(namespace, sshKey);
      } catch (e) {
        expect((e as unknown as Error).message).toEqual(
          `Unable to add SSH key "${sshKey.name}": ${errorMessage}`,
        );
      }
    });
  });

  describe('deleting SSH key secret', () => {
    it('should delete key', async () => {
      const name = 'asdf-1234';
      await sshKeysService.delete(namespace, name);

      expect(spyDeleteNamespacedSecret).toHaveBeenCalledTimes(1);
    });

    it('should return error if unable to delete the secret', async () => {
      const errorMessage = 'Conflict';
      spyDeleteNamespacedSecret.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const name = 'asdf-1234';

      expect.assertions(1);

      try {
        await sshKeysService.delete(namespace, name);
      } catch (e) {
        expect((e as unknown as Error).message).toEqual(
          `Unable to delete SSH key "${name}" in the namespace "${namespace}": ${errorMessage}`,
        );
      }
    });
  });
});
