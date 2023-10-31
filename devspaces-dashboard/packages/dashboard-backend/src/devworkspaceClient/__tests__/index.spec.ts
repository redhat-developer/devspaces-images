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

import { DevWorkspaceApiService } from '@/devworkspaceClient/services/devWorkspaceApi';
import { DevWorkspaceTemplateApiService } from '@/devworkspaceClient/services/devWorkspaceTemplateApi';
import { DockerConfigApiService } from '@/devworkspaceClient/services/dockerConfigApi';
import { EventApiService } from '@/devworkspaceClient/services/eventApi';
import { GettingStartedSamplesApiService } from '@/devworkspaceClient/services/gettingStartedSamplesApi';
import { GitConfigApiService } from '@/devworkspaceClient/services/gitConfigApi';
import { KubeConfigApiService } from '@/devworkspaceClient/services/kubeConfigApi';
import { LogsApiService } from '@/devworkspaceClient/services/logsApi';
import { PodApiService } from '@/devworkspaceClient/services/podApi';
import { ServerConfigApiService } from '@/devworkspaceClient/services/serverConfigApi';
import { SshKeysService } from '@/devworkspaceClient/services/sshKeysApi';
import { UserProfileApiService } from '@/devworkspaceClient/services/userProfileApi';

import { DevWorkspaceClient } from '..';

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

    expect(client.devWorkspaceTemplateApi).toBeInstanceOf(DevWorkspaceTemplateApiService);
    expect(client.devworkspaceApi).toBeInstanceOf(DevWorkspaceApiService);
    expect(client.dockerConfigApi).toBeInstanceOf(DockerConfigApiService);
    expect(client.eventApi).toBeInstanceOf(EventApiService);
    expect(client.kubeConfigApi).toBeInstanceOf(KubeConfigApiService);
    expect(client.logsApi).toBeInstanceOf(LogsApiService);
    expect(client.podApi).toBeInstanceOf(PodApiService);
    expect(client.serverConfigApi).toBeInstanceOf(ServerConfigApiService);
    expect(client.userProfileApi).toBeInstanceOf(UserProfileApiService);
    expect(client.gitConfigApi).toBeInstanceOf(GitConfigApiService);
    expect(client.gettingStartedSampleApi).toBeInstanceOf(GettingStartedSamplesApiService);
    expect(client.sshKeysApi).toBeInstanceOf(SshKeysService);
  });
});
