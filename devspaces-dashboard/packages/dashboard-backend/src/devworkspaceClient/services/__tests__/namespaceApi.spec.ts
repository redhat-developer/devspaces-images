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
import { CoreV1Api, V1NamespaceList } from '@kubernetes/client-node';
import { NamespaceApiService } from '../namespaceApi';

jest.mock('../../../helpers/getUserName.ts');

const userNamespace = 'user1-che';

describe('Namespace API Service', () => {
  let namespaceService: NamespaceApiService;

  beforeEach(() => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();

    kubeConfig.makeApiClient = jest.fn().mockImplementation(_api => {
      return {
        listNamespace: () => {
          return Promise.resolve(buildListNamespaces());
        },
      } as CoreV1Api;
    });

    namespaceService = new NamespaceApiService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('namespaces list', async () => {
    const res = await namespaceService.getNamespaces('token');
    expect(res).toEqual([userNamespace]);
  });
});

function buildListNamespaces(): { body: V1NamespaceList } {
  return {
    body: {
      apiVersion: 'v1',
      items: [
        {
          metadata: {
            labels: {
              'kubernetes.io/metadata.name': 'eclipse-che',
            },
            name: 'eclipse-che',
          },
        },
        {
          metadata: {
            annotations: {
              'che.eclipse.org/username': 'user1',
            },
            labels: {
              'app.kubernetes.io/component': 'workspaces-namespace',
              'app.kubernetes.io/part-of': 'che.eclipse.org',
              'kubernetes.io/metadata.name': 'user1-che',
            },
            name: userNamespace,
          },
        },
      ],
      kind: 'NamespaceList',
    },
  };
}
