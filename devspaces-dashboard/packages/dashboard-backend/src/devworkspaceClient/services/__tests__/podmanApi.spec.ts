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

/* eslint-disable @typescript-eslint/no-unused-vars */

import * as mockClient from '@kubernetes/client-node';
import { CoreV1Api, HttpError, V1PodList, V1Secret } from '@kubernetes/client-node';

import * as helper from '@/devworkspaceClient/services/helpers/exec';
import { PodmanApiService } from '@/devworkspaceClient/services/podmanApi';

jest.mock('@/helpers/getUserName.ts');

const userNamespace = 'user-che';
const workspaceName = 'workspace-1';
const containerName = 'container-1';
const workspaceId = 'workspace-id-1';

const spyExec = jest
  .spyOn(helper, 'exec')
  .mockImplementation((..._args: Parameters<typeof helper.exec>) => {
    return Promise.resolve({
      stdOut: '',
      stdError: '',
    });
  });

describe('podman Config API Service', () => {
  let podmanApiService: PodmanApiService;
  const mockReadNamespaceSecret = jest.fn();

  beforeEach(() => {
    jest.resetModules();

    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();

    kubeConfig.makeApiClient = jest.fn().mockImplementation(_api => {
      return {
        listNamespacedPod: () => {
          return Promise.resolve(buildListNamespacedPod());
        },
        readNamespacedSecret: () => mockReadNamespaceSecret(),
      } as unknown as CoreV1Api;
    });

    podmanApiService = new PodmanApiService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Container registry secret contains correct data', async () => {
    mockReadNamespaceSecret.mockResolvedValueOnce(buildSecretWithCorrectCredentials());

    await podmanApiService.podmanLogin(userNamespace, workspaceId);

    expect(spyExec).toHaveBeenCalledWith(
      workspaceName,
      userNamespace,
      containerName,
      expect.arrayContaining([
        'sh',
        '-c',
        expect.stringContaining(
          'podman login registry1 -u user1 -p password1 || true\npodman login registry2 -u user2 -p password2 || true',
        ),
      ]),
      expect.anything(),
    );
  });

  test('Container registry secret contains incorrect data', async () => {
    mockReadNamespaceSecret.mockResolvedValueOnce(buildSecretWithIncorrectCredentials());

    await podmanApiService.podmanLogin(userNamespace, workspaceId);

    expect(spyExec).toHaveBeenCalledWith(
      workspaceName,
      userNamespace,
      containerName,
      expect.not.arrayContaining(['sh', '-c', expect.stringMatching('podman login registry')]),
      expect.anything(),
    );
  });

  test('Container registry secret not found', async () => {
    mockReadNamespaceSecret.mockRejectedValueOnce(new HttpError({} as any, null, 404));

    await podmanApiService.podmanLogin(userNamespace, workspaceId);
    expect(spyExec).toHaveBeenCalledWith(
      workspaceName,
      userNamespace,
      containerName,
      expect.not.arrayContaining(['sh', '-c', expect.stringMatching('podman login registry')]),
      expect.anything(),
    );
  });

  function buildSecretWithCorrectCredentials(): { body: V1Secret } {
    return {
      body: {
        apiVersion: 'v1',
        data: {
          '.dockerconfigjson': Buffer.from(
            '{"auths":' +
              '{' +
              '"registry1":{"username":"user1","password":"password1"},' +
              '"registry2":{"auth":"' +
              Buffer.from('user2:password2', 'binary').toString('base64') +
              '"}}' +
              '}',
            'binary',
          ).toString('base64'),
        },
        kind: 'Secret',
      },
    };
  }

  function buildSecretWithIncorrectCredentials(): { body: V1Secret } {
    return {
      body: {
        apiVersion: 'v1',
        data: {
          '.dockerconfigjson': Buffer.from(
            '{"auths":' +
              '{' +
              '"registry1":{"username":"user"},' +
              '"registry2":{"password":"password"},' +
              '"registry3":{"auth":"dXNlcg=="},' + // user
              '"registry4":{"auth":"dXNlcjo="},' + // user:
              '"registry5":{}' +
              '}' +
              '}',
            'binary',
          ).toString('base64'),
        },
        kind: 'Secret',
      },
    };
  }

  function buildListNamespacedPod(): { body: V1PodList } {
    return {
      body: {
        apiVersion: 'v1',
        items: [
          {
            metadata: {
              name: workspaceName,
              namespace: userNamespace,
            },
            spec: {
              containers: [{ name: containerName }],
            },
          },
        ],
        kind: 'PodList',
      },
    };
  }
});
