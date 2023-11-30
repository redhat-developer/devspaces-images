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

import { api } from '@eclipse-che/common';
import { waitFor } from '@testing-library/react';
import mockAxios from 'axios';
import WS from 'jest-websocket-mock';
import { Store } from 'redux';

import PreloadData from '@/services/bootstrap';
import { BrandingData } from '@/services/bootstrap/branding.constant';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

jest.mock('@/services/helpers/delay', () => ({ delay: jest.fn() }));

const mockAppendLink = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/resource-fetcher/appendLink', () => {
  return {
    appendLink: (url: string) => mockAppendLink(url),
  };
});

// mute the outputs
console.log = jest.fn();

describe('Dashboard bootstrap', () => {
  const namespace = {
    name: 'test-che',
    attributes: {
      phase: 'Active',
    },
  } as che.KubernetesNamespace;

  const mockGet = mockAxios.get as jest.Mock;
  const mockPost = mockAxios.post as jest.Mock;

  let server: WS;
  let preloadData: PreloadData;

  beforeAll(() => {
    server = new WS('ws://localhost/dashboard/api/websocket');
  });

  beforeEach(() => {
    const store = getStore(namespace);
    preloadData = new PreloadData(store);
  });

  afterEach(() => {
    WS.clean();
    jest.resetAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  test('requests which should be sent', async () => {
    prepareMocks(mockPost, 1, namespace); // provisionNamespace
    prepareMocks(mockGet, 15, []); // branding, namespace, prefetch, server-config, cluster-info, userprofile, plugin-registry, default-editor, devfile-registry, getting-started-sample, devworkspacetemplates, devworkspaces, events, pods, cluster-config

    await preloadData.init();

    // wait for all POST requests to be sent
    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
    expect(mockPost).toHaveBeenCalledWith(
      '/api/kubernetes/namespace/provision',
      undefined,
      undefined,
    );
    // wait for all GET requests to be sent
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(15));
    expect(mockGet).toHaveBeenCalledWith('./assets/branding/product.json');
    expect(mockGet).toHaveBeenCalledWith('/api/kubernetes/namespace', undefined);
    expect(mockGet).toHaveBeenCalledWith('https://prefetch-che-cdn.test', {
      headers: { 'Cache-Control': 'no-cache', Expires: '0' },
    });
    expect(mockGet).toHaveBeenCalledWith('/dashboard/api/server-config');
    expect(mockGet).toHaveBeenCalledWith('/dashboard/api/cluster-info');
    expect(mockGet).toHaveBeenCalledWith('/dashboard/api/userprofile/test-che', undefined);
    expect(mockGet).toHaveBeenCalledWith('/plugin-registry/v3/plugins/index.json');
    expect(mockGet).toHaveBeenCalledWith('/plugin-registry/v3/plugins/default-editor/devfile.yaml');
    expect(mockGet).toHaveBeenCalledWith(
      'http://localhost/dashboard/devfile-registry/devfiles/index.json',
    );
    expect(mockGet).toHaveBeenCalledWith('http://localhost/dashboard/api/getting-started-sample');
    expect(mockGet).toHaveBeenCalledWith(
      '/dashboard/api/namespace/test-che/devworkspacetemplates',
      undefined,
    );
    expect(mockGet).toHaveBeenCalledWith(
      '/dashboard/api/namespace/test-che/devworkspaces',
      undefined,
    );
    expect(mockGet).toHaveBeenCalledWith('/dashboard/api/namespace/test-che/events', undefined);
    expect(mockGet).toHaveBeenCalledWith('/dashboard/api/namespace/test-che/pods', undefined);
    expect(mockGet).toHaveBeenCalledWith('/dashboard/api/cluster-config');
    // todo: figure out why ws tests fail on github actions
    // wait for all WS messages to be sent
    // expect(server).toHaveReceivedMessages([
    //   '{"method":"SUBSCRIBE","channel":"devWorkspace","params":{"namespace":"test-che","resourceVersion":"0"}}',
    // ]);
    // expect(server).toHaveReceivedMessages([
    //   '{"method":"SUBSCRIBE","channel":"event","params":{"namespace":"test-che","resourceVersion":"0"}}',
    // ]);
    // expect(server).toHaveReceivedMessages([
    //   '{"method":"SUBSCRIBE","channel":"pod","params":{"namespace":"test-che","resourceVersion":"0"}}',
    // ]);

    // wait for all appendLink calls
    expect(mockAppendLink.mock.calls).toEqual([
      ['https://prefetch-resource-1.test'],
      ['https://prefetch-resource-2.test'],
    ]);
  });
});

function getStore(namespace: che.KubernetesNamespace): Store {
  return new FakeStoreBuilder()
    .withBranding({
      configuration: {
        prefetch: {
          cheCDN: 'https://prefetch-che-cdn.test',
          resources: ['https://prefetch-resource-1.test', 'https://prefetch-resource-2.test'],
        },
      },
    } as BrandingData)
    .withInfrastructureNamespace([namespace])
    .withDwServerConfig({
      defaults: {
        editor: 'default-editor',
      },
      pluginRegistryURL: '/plugin-registry/v3',
    } as api.IServerConfig)
    .build();
}

function prepareMocks(mock: jest.Mock, quantity: number, value: [] | object): void {
  for (let i = 0; i < quantity; i++) {
    mock.mockResolvedValueOnce({ data: value });
  }
}
