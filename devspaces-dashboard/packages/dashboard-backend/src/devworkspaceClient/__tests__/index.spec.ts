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

import * as mockClientNode from '@kubernetes/client-node';
import { KubeConfig } from '@kubernetes/client-node';
import { DevWorkspaceClient } from '..';
import { DevWorkspaceApiService } from '../services/devWorkspaceApi';
import { DevWorkspaceTemplateApiService } from '../services/devWorkspaceTemplateApi';
import { DockerConfigApiService } from '../services/dockerConfigApi';
import { KubeConfigApiService } from '../services/kubeConfigApi';
import { NamespaceApiService } from '../services/namespaceApi';
import { ServerConfigApiService } from '../services/serverConfigApi';
import { UserProfileApiService } from '../services/userProfileApi';

jest.mock('../services/devWorkspaceApi.ts');

describe('DevWorkspace client', () => {
  let config: KubeConfig;
  beforeEach(() => {
    const { KubeConfig } = mockClientNode;
    config = new KubeConfig();
    config.makeApiClient = jest.fn().mockImplementation(() => ({}));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('client', () => {
    const client = new DevWorkspaceClient(config);

    expect(client.devworkspaceApi).toBeInstanceOf(DevWorkspaceApiService);
    expect(client.dockerConfigApi).toBeInstanceOf(DockerConfigApiService);
    expect(client.kubeConfigApi).toBeInstanceOf(KubeConfigApiService);
    expect(client.namespaceApi).toBeInstanceOf(NamespaceApiService);
    expect(client.serverConfigApi).toBeInstanceOf(ServerConfigApiService);
    expect(client.devWorkspaceTemplateApi).toBeInstanceOf(DevWorkspaceTemplateApiService);
    expect(client.userProfileApi).toBeInstanceOf(UserProfileApiService);
  });
});
