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

import * as mockClient from '@kubernetes/client-node';
import { CoreV1Api, HttpError } from '@kubernetes/client-node';
import { IncomingMessage } from 'http';

import { KubeConfigApiService } from '@/devworkspaceClient/services/kubeConfigApi';

const namespace = 'user-che';

describe('Kubernetes Config API Service', () => {
  let kubeConfigService: KubeConfigApiService;
  let spyCreateNamespacedSecret: jest.SpyInstance;
  let spyReadNamespacedSecret: jest.SpyInstance;
  let spyReplaceNamespacedSecret: jest.SpyInstance;

  console.error = jest.fn();
  console.warn = jest.fn();

  function initMocks(readNamespacedSecretReturnPromise: Promise<any>): void {
    const stubCoreV1Api = {
      createNamespacedSecret: (_namespace: string, secret: any) => {
        return Promise.resolve({ body: secret });
      },
      readNamespacedSecret: () => {
        return readNamespacedSecretReturnPromise;
      },
      replaceNamespacedSecret: (_name: string, _namespace: string, secret: any) => {
        return Promise.resolve({ body: secret });
      },
    } as unknown as CoreV1Api;

    spyCreateNamespacedSecret = jest.spyOn(stubCoreV1Api, 'createNamespacedSecret');
    spyReadNamespacedSecret = jest.spyOn(stubCoreV1Api, 'readNamespacedSecret');
    spyReplaceNamespacedSecret = jest.spyOn(stubCoreV1Api, 'replaceNamespacedSecret');

    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();
    kubeConfig.makeApiClient = jest.fn().mockImplementation(_api => stubCoreV1Api);

    kubeConfigService = new KubeConfigApiService(kubeConfig);
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('create kubeconfig Secret', async () => {
    initMocks(Promise.reject(new HttpError({} as IncomingMessage, undefined, 404)));

    await kubeConfigService.applyKubeConfigSecret(namespace);

    expect(spyReadNamespacedSecret).toBeCalled();
    expect(spyCreateNamespacedSecret).toBeCalled();
    expect(spyReplaceNamespacedSecret).toBeCalledTimes(0);
  });

  test('replace kubeconfig Secret', async () => {
    initMocks(Promise.resolve({} as any));

    await kubeConfigService.applyKubeConfigSecret(namespace);

    expect(spyReadNamespacedSecret).toBeCalled();
    expect(spyCreateNamespacedSecret).toBeCalledTimes(0);
    expect(spyReplaceNamespacedSecret).toBeCalled();
  });
});
