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
import { CustomObjectsApi } from '@kubernetes/client-node';

import { DevWorkspacePreferencesApiService } from '@/devworkspaceClient/services/devWorkspacePreferencesApi';

describe('DevWorkspace Preferences API Service', () => {
  let devWorkspacePreferencesApiService: DevWorkspacePreferencesApiService;

  const setup = (stubCustomObjectsApi: CustomObjectsApi) => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();

    kubeConfig.makeApiClient = jest.fn().mockImplementation(_api => stubCustomObjectsApi);

    devWorkspacePreferencesApiService = new DevWorkspacePreferencesApiService(kubeConfig);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('get skip-authorisation workspace preferences from empty configmap', async () => {
    const stubCustomObjectsApi = {
      readNamespacedConfigMap: () => {
        return Promise.resolve({ body: {} });
      },
    } as unknown as CustomObjectsApi;
    setup(stubCustomObjectsApi);
    const res =
      await devWorkspacePreferencesApiService.getWorkspacePreferences('skip-authorisation');
    expect(res['skip-authorisation']).toEqual([]);
  });

  test('get skip-authorisation workspace preferences from configmap with empty skip-authorisation', async () => {
    const stubCustomObjectsApi = {
      readNamespacedConfigMap: () => {
        return Promise.resolve({ body: { body: { data: { 'skip-authorisation': '[]' } } } });
      },
    } as unknown as CustomObjectsApi;
    setup(stubCustomObjectsApi);
    const res =
      await devWorkspacePreferencesApiService.getWorkspacePreferences('skip-authorisation');
    expect(res['skip-authorisation']).toEqual([]);
  });

  test('get skip-authorisation workspace preferences from configmap with skip-authorisation values', async () => {
    const stubCustomObjectsApi = {
      readNamespacedConfigMap: () => {
        return Promise.resolve({
          body: { data: { 'skip-authorisation': '[github, gitlab, bitbucket]' } },
        });
      },
    } as unknown as CustomObjectsApi;
    setup(stubCustomObjectsApi);
    const res =
      await devWorkspacePreferencesApiService.getWorkspacePreferences('skip-authorisation');
    expect(res['skip-authorisation']).toEqual(['github', 'gitlab', 'bitbucket']);
  });
});
