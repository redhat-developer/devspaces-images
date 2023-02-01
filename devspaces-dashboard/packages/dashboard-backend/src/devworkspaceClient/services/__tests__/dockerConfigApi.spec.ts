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
import { CoreV1Api, V1Secret } from '@kubernetes/client-node';
import { DockerConfigApiService, SECRET_KEY, SECRET_NAME } from '../dockerConfigApi';

describe('Docker Config API Service', () => {
  let dockerConfigService: DockerConfigApiService;

  const namespace = 'user-che';
  const emptyConfig = 'eyJhdXRocyI6e319';
  const updatedConfig =
    'eyJhdXRocyI6eyJzb21lLXJlZ2lzdHJ5Ijp7InVzZXJuYW1lIjoidXNlcjEiLCJwYXNzd29yZCI6InBhc3N3b3JkMSIsImF1dGgiOiJkWE5sY2pFNmNHRnpjM2R2Y21ReCJ9fX0=';

  const stubCoreV1Api = {
    readNamespacedSecret: (_name, _namespace) => {
      return Promise.resolve(buildSecret(namespace, emptyConfig));
    },
    replaceNamespacedSecret: (_name, _namespace, _body) => {
      return Promise.resolve(buildSecret(namespace, updatedConfig));
    },
  } as CoreV1Api;

  const spyReadNamespacedSecret = jest.spyOn(stubCoreV1Api, 'readNamespacedSecret');
  const spyReplaceNamespacedSecret = jest.spyOn(stubCoreV1Api, 'replaceNamespacedSecret');

  beforeEach(() => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();

    kubeConfig.makeApiClient = jest.fn().mockImplementation(_api => stubCoreV1Api);

    dockerConfigService = new DockerConfigApiService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('reading dockerconfig', async () => {
    const result = await dockerConfigService.read(namespace);
    expect(result.dockerconfig).toEqual(emptyConfig);
    expect(spyReadNamespacedSecret).toHaveBeenCalled();
  });

  test('updating dockerconfig', async () => {
    const result = await dockerConfigService.update(namespace, {
      dockerconfig: updatedConfig,
    });
    expect(result.dockerconfig).toEqual(updatedConfig);
    expect(spyReplaceNamespacedSecret).toHaveBeenCalledWith(
      SECRET_NAME,
      namespace,
      expect.objectContaining({
        data: {
          [SECRET_KEY]: updatedConfig,
        },
      }),
    );
  });
});

function buildSecret(namespace: string, dockerConfig: string): { body: V1Secret } {
  return {
    body: {
      apiVersion: 'v1',
      data: { '.dockerconfigjson': dockerConfig },
      kind: 'Secret',
      type: 'kubernetes.io/dockerconfigjson',
      metadata: {
        namespace,
        resourceVersion: '1',
      },
    } as V1Secret,
  };
}
