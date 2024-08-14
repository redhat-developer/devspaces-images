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
import { CustomObjectsApi } from '@kubernetes/client-node';
import { IncomingMessage } from 'http';

import {
  DEV_WORKSPACE_PREFERENCES_CONFIGMAP,
  SKIP_AUTHORIZATION_KEY,
  TRUSTED_SOURCES_KEY,
  WorkspacePreferencesApiService,
} from '@/devworkspaceClient/services/workspacePreferencesApi';

jest.mock('@/devworkspaceClient/services/helpers/retryableExec');

const namespace = 'user-che';

describe('Workspace Preferences API Service', () => {
  let workspacePreferencesApiService: WorkspacePreferencesApiService;

  const stubCoreV1Api = {
    readNamespacedConfigMap: () => {
      return Promise.resolve({
        body: {} as mockClient.V1ConfigMap,
        response: {} as IncomingMessage,
      });
    },
    patchNamespacedConfigMap: () => {
      return Promise.resolve({
        body: {} as mockClient.V1ConfigMap,
        response: {} as IncomingMessage,
      });
    },
  };

  const spyReadNamespacedConfigMap = jest.spyOn(stubCoreV1Api, 'readNamespacedConfigMap');
  const spyPatchNamespacedConfigMap = jest.spyOn(stubCoreV1Api, 'patchNamespacedConfigMap');

  beforeEach(() => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();
    kubeConfig.makeApiClient = jest.fn().mockImplementation(() => stubCoreV1Api);

    workspacePreferencesApiService = new WorkspacePreferencesApiService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('get skip-authorisation workspace preferences from empty configmap', async () => {
    const res = await workspacePreferencesApiService.getWorkspacePreferences(namespace);

    expect(res[SKIP_AUTHORIZATION_KEY]).toEqual([]);
    expect(spyReadNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).not.toHaveBeenCalled();
  });

  test('get skip-authorisation workspace preferences from configmap with empty skip-authorisation', async () => {
    spyReadNamespacedConfigMap.mockResolvedValueOnce({
      body: { data: { [SKIP_AUTHORIZATION_KEY]: '[]' } },
      response: {} as IncomingMessage,
    });
    const res = await workspacePreferencesApiService.getWorkspacePreferences(namespace);

    expect(res[SKIP_AUTHORIZATION_KEY]).toEqual([]);
    expect(spyReadNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).not.toHaveBeenCalled();
  });

  test('get skip-authorisation workspace preferences from configmap with skip-authorisation values', async () => {
    spyReadNamespacedConfigMap.mockResolvedValueOnce({
      body: { data: { [SKIP_AUTHORIZATION_KEY]: '[github, gitlab, bitbucket]' } },
      response: {} as IncomingMessage,
    });

    const res = await workspacePreferencesApiService.getWorkspacePreferences(namespace);

    expect(res[SKIP_AUTHORIZATION_KEY]).toEqual(['github', 'gitlab', 'bitbucket']);
    expect(spyReadNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).not.toHaveBeenCalled();
  });

  test('remove a provider from skip-authorisation workspace preferences', async () => {
    spyReadNamespacedConfigMap.mockResolvedValueOnce({
      body: { data: { [SKIP_AUTHORIZATION_KEY]: '[github, gitlab, bitbucket]' } },
      response: {} as IncomingMessage,
    });

    await workspacePreferencesApiService.removeProviderFromSkipAuthorizationList(
      namespace,
      'gitlab',
    );

    expect(spyReadNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).toHaveBeenCalledWith(
      DEV_WORKSPACE_PREFERENCES_CONFIGMAP,
      'user-che',
      {
        data: { [SKIP_AUTHORIZATION_KEY]: '[github, bitbucket]' },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'content-type': 'application/strategic-merge-patch+json' } },
    );
  });

  test('add a very first trusted source URL to trusted-source workspace preferences', async () => {
    spyReadNamespacedConfigMap.mockResolvedValueOnce({
      body: { data: {} },
      response: {} as IncomingMessage,
    });

    await workspacePreferencesApiService.addTrustedSource(namespace, 'source-url');

    expect(spyReadNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).toHaveBeenCalledWith(
      DEV_WORKSPACE_PREFERENCES_CONFIGMAP,
      namespace,
      {
        data: {
          [SKIP_AUTHORIZATION_KEY]: '[]',
          [TRUSTED_SOURCES_KEY]: '["source-url"]',
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

  test('add a new trusted source URL to trusted-source workspace preferences', async () => {
    spyReadNamespacedConfigMap.mockResolvedValueOnce({
      body: {
        data: {
          [TRUSTED_SOURCES_KEY]: '["source1", "source2"]',
        },
      },
      response: {} as IncomingMessage,
    });

    await workspacePreferencesApiService.addTrustedSource(namespace, 'source3');

    expect(spyReadNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).toHaveBeenCalledWith(
      DEV_WORKSPACE_PREFERENCES_CONFIGMAP,
      namespace,
      {
        data: {
          [SKIP_AUTHORIZATION_KEY]: '[]',
          [TRUSTED_SOURCES_KEY]: '["source1","source2","source3"]',
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

  test('add trust all to trusted-source workspace preferences when there is some trusted URLs', async () => {
    spyReadNamespacedConfigMap.mockResolvedValueOnce({
      body: {
        data: {
          [TRUSTED_SOURCES_KEY]: '["source1", "source2"]',
        },
      },
      response: {} as IncomingMessage,
    });

    await workspacePreferencesApiService.addTrustedSource(namespace, '*');

    expect(spyReadNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).toHaveBeenCalledWith(
      DEV_WORKSPACE_PREFERENCES_CONFIGMAP,
      namespace,
      {
        data: {
          [SKIP_AUTHORIZATION_KEY]: '[]',
          [TRUSTED_SOURCES_KEY]: '"*"',
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

  test('delete all trusted sources from trusted-source workspace preferences', async () => {
    spyReadNamespacedConfigMap.mockResolvedValueOnce({
      body: {
        data: {
          [TRUSTED_SOURCES_KEY]: '["source1", "source2"]',
        },
      },
      response: {} as IncomingMessage,
    });

    await workspacePreferencesApiService.removeTrustedSources(namespace);

    expect(spyReadNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).toHaveBeenCalled();
    expect(spyPatchNamespacedConfigMap).toHaveBeenCalledWith(
      DEV_WORKSPACE_PREFERENCES_CONFIGMAP,
      namespace,
      {
        data: {
          [SKIP_AUTHORIZATION_KEY]: '[]',
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
});
