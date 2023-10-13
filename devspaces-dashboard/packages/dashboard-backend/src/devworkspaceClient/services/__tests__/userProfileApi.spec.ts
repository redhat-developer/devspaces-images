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

import { UserProfileApiService } from '@/devworkspaceClient/services/userProfileApi';

jest.mock('../../../helpers/getUserName.ts');

const userNamespace = 'user1-che';

describe('UserProfile API Service', () => {
  let userProfileService: UserProfileApiService;

  beforeEach(() => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();

    kubeConfig.makeApiClient = jest.fn().mockImplementation(_api => {
      return {
        readNamespacedSecret: (_name, _namespace) => {
          return Promise.resolve(buildSecret());
        },
      } as CoreV1Api;
    });

    userProfileService = new UserProfileApiService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('user profile object', async () => {
    const res = await userProfileService.getUserProfile(userNamespace);
    expect(res).toEqual({ email: 'user1@che', username: 'user1' });
  });
});

function buildSecret(): { body: V1Secret } {
  return {
    body: {
      apiVersion: 'v1',
      data: {
        email: 'dXNlcjFAY2hl',
        id: 'Q2dFeEVnVnNiMk5oYkE=',
        name: 'dXNlcjE=',
      },
      kind: 'Secret',
    },
  };
}
