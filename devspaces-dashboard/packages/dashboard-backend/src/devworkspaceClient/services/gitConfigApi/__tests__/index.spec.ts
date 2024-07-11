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
import * as mockClient from '@kubernetes/client-node';
import { CoreV1Api, V1ConfigMap } from '@kubernetes/client-node';
import { IncomingMessage } from 'http';

import { GitConfigApiService } from '..';

jest.mock('@/devworkspaceClient/services/helpers/retryableExec.ts');

const namespace = 'user-che';
const responseBody = {
  data: {
    gitconfig: `[user]\n\tname = User One\n\temail = user-1@che`,
  },
};

describe('Gitconfig API', () => {
  let gitConfigApiService: GitConfigApiService;

  const stubCoreV1Api = {
    readNamespacedConfigMap: () => {
      return Promise.resolve({
        body: responseBody as V1ConfigMap,
        response: {} as IncomingMessage,
      });
    },
    patchNamespacedConfigMap: () => {
      return Promise.resolve({
        body: responseBody as V1ConfigMap,
        response: {} as IncomingMessage,
      });
    },
  } as unknown as CoreV1Api;
  const spyReadNamespacedConfigMap = jest.spyOn(stubCoreV1Api, 'readNamespacedConfigMap');
  const spyPatchNamespacedConfigMap = jest.spyOn(stubCoreV1Api, 'patchNamespacedConfigMap');

  beforeEach(() => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();
    kubeConfig.makeApiClient = jest.fn().mockImplementation(() => stubCoreV1Api);

    gitConfigApiService = new GitConfigApiService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('reading gitconfig', () => {
    it('should return gitconfig', async () => {
      const resp = await gitConfigApiService.read(namespace);

      expect(resp.gitconfig).toStrictEqual(
        expect.objectContaining({
          user: expect.objectContaining({
            name: 'User One',
            email: 'user-1@che',
          }),
        }),
      );

      expect(spyReadNamespacedConfigMap).toHaveBeenCalledTimes(1);
      expect(spyPatchNamespacedConfigMap).not.toHaveBeenCalled();
    });

    it('should throw', async () => {
      spyReadNamespacedConfigMap.mockRejectedValueOnce('404 not found');

      try {
        await gitConfigApiService.read(namespace);

        // should not reach here
        expect(false).toBeTruthy();
      } catch (e) {
        expect((e as Error).message).toBe(
          'Unable to read gitconfig in the namespace "user-che": 404 not found',
        );
      }

      expect(spyReadNamespacedConfigMap).toHaveBeenCalledTimes(1);
      expect(spyPatchNamespacedConfigMap).not.toHaveBeenCalled();
    });
  });

  describe('patching gitconfig', () => {
    it('should patch and return gitconfig', async () => {
      const newGitConfig = {
        gitconfig: {
          user: {
            email: 'user-2@che',
            name: 'User Two',
          },
        },
      } as api.IGitConfig;
      await gitConfigApiService.patch(namespace, newGitConfig);

      expect(spyReadNamespacedConfigMap).toHaveBeenCalledTimes(1);
      expect(spyPatchNamespacedConfigMap).toHaveBeenCalledTimes(1);
      expect(spyPatchNamespacedConfigMap).toHaveBeenCalledWith(
        'workspace-userdata-gitconfig-configmap',
        'user-che',
        {
          data: {
            gitconfig: `[user]
email="user-2@che"
name="User Two"
`,
          },
        },
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { headers: { 'content-type': 'application/strategic-merge-patch+json' } },
      );
    });

    it('should throw when can`t read the ConfigMap', async () => {
      spyReadNamespacedConfigMap.mockRejectedValueOnce('404 not found');

      const newGitConfig = {
        gitconfig: {
          user: {
            email: 'user-2@che',
            name: 'User Two',
          },
        },
      } as api.IGitConfig;

      try {
        await gitConfigApiService.patch(namespace, newGitConfig);

        // should not reach here
        expect(false).toBeTruthy();
      } catch (e) {
        expect((e as Error).message).toBe(
          'Unable to update gitconfig in the namespace "user-che".',
        );
      }

      expect(spyReadNamespacedConfigMap).toHaveBeenCalledTimes(1);
      expect(spyPatchNamespacedConfigMap).toHaveBeenCalledTimes(0);
    });

    it('should throw when failed to patch the ConfigMap', async () => {
      spyPatchNamespacedConfigMap.mockRejectedValueOnce('some error');

      const newGitConfig = {
        gitconfig: {
          user: {
            email: 'user-2@che',
            name: 'User Two',
          },
        },
      } as api.IGitConfig;

      try {
        await gitConfigApiService.patch(namespace, newGitConfig);

        // should not reach here
        expect(false).toBeTruthy();
      } catch (e) {
        expect((e as Error).message).toBe(
          'Unable to update gitconfig in the namespace "user-che": some error',
        );
      }

      expect(spyReadNamespacedConfigMap).toHaveBeenCalledTimes(1);
      expect(spyPatchNamespacedConfigMap).toHaveBeenCalledTimes(1);
    });

    it('should throw when conflict detected', async () => {
      spyReadNamespacedConfigMap.mockResolvedValueOnce({
        body: {
          metadata: {
            resourceVersion: '2',
          },
          data: {
            gitconfig: `[user]
name="User Two"
email="user-2@che"
`,
          },
        } as V1ConfigMap,
        response: {} as IncomingMessage,
      });

      const newGitConfig = {
        gitconfig: {
          user: {
            email: 'user-2@che',
            name: 'User Two',
          },
        },
        resourceVersion: '1',
      } as api.IGitConfig;

      try {
        await gitConfigApiService.patch(namespace, newGitConfig);

        // should not reach here
        expect(false).toBeTruthy();
      } catch (e) {
        expect((e as Error).message).toBe(
          'Conflict detected. The gitconfig was modified in the namespace "user-che".',
        );
      }

      expect(spyReadNamespacedConfigMap).toHaveBeenCalledTimes(1);
      expect(spyPatchNamespacedConfigMap).toHaveBeenCalledTimes(0);
    });
  });
});
