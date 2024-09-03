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

import * as k8s from '@kubernetes/client-node';

import { AirGapSampleApiService } from '@/devworkspaceClient/services/airGapSampleApi';
import { DevWorkspaceApiService } from '@/devworkspaceClient/services/devWorkspaceApi';
import { DevWorkspaceClusterApiService } from '@/devworkspaceClient/services/devWorkspaceClusterApiService';
import { DevWorkspaceTemplateApiService } from '@/devworkspaceClient/services/devWorkspaceTemplateApi';
import { DockerConfigApiService } from '@/devworkspaceClient/services/dockerConfigApi';
import { EditorsApiService } from '@/devworkspaceClient/services/editorsApi';
import { EventApiService } from '@/devworkspaceClient/services/eventApi';
import { GettingStartedSamplesApiService } from '@/devworkspaceClient/services/gettingStartedSamplesApi';
import { GitConfigApiService } from '@/devworkspaceClient/services/gitConfigApi';
import { KubeConfigApiService } from '@/devworkspaceClient/services/kubeConfigApi';
import { LogsApiService } from '@/devworkspaceClient/services/logsApi';
import { PersonalAccessTokenService } from '@/devworkspaceClient/services/personalAccessTokenApi';
import { PodApiService } from '@/devworkspaceClient/services/podApi';
import { PodmanApiService } from '@/devworkspaceClient/services/podmanApi';
import { ServerConfigApiService } from '@/devworkspaceClient/services/serverConfigApi';
import { SshKeysService } from '@/devworkspaceClient/services/sshKeysApi';
import { UserProfileApiService } from '@/devworkspaceClient/services/userProfileApi';
import { WorkspacePreferencesApiService } from '@/devworkspaceClient/services/workspacePreferencesApi';
import {
  IAirGapSampleApi,
  IDevWorkspaceApi,
  IDevWorkspaceClient,
  IDevWorkspaceClusterApi,
  IDevWorkspaceSingletonClient,
  IDevWorkspaceTemplateApi,
  IDockerConfigApi,
  IEditorsApi,
  IEventApi,
  IGettingStartedSampleApi,
  IGitConfigApi,
  IKubeConfigApi,
  ILogsApi,
  IPersonalAccessTokenApi,
  IPodApi,
  IPodmanApi,
  IServerConfigApi,
  IShhKeysApi,
  IUserProfileApi,
  IWorkspacePreferencesApi,
} from '@/devworkspaceClient/types';

export * from './types';

export class DevWorkspaceClient implements IDevWorkspaceClient {
  private readonly kubeConfig: k8s.KubeConfig;

  constructor(kc: k8s.KubeConfig) {
    this.kubeConfig = kc;
  }

  get eventApi(): IEventApi {
    return new EventApiService(this.kubeConfig);
  }

  get podApi(): IPodApi {
    return new PodApiService(this.kubeConfig);
  }

  get devWorkspaceTemplateApi(): IDevWorkspaceTemplateApi {
    return new DevWorkspaceTemplateApiService(this.kubeConfig);
  }

  get devworkspaceApi(): IDevWorkspaceApi {
    return new DevWorkspaceApiService(this.kubeConfig);
  }

  get dockerConfigApi(): IDockerConfigApi {
    return new DockerConfigApiService(this.kubeConfig);
  }

  get serverConfigApi(): IServerConfigApi {
    return new ServerConfigApiService(this.kubeConfig);
  }

  get kubeConfigApi(): IKubeConfigApi {
    return new KubeConfigApiService(this.kubeConfig);
  }

  get podmanApi(): IPodmanApi {
    return new PodmanApiService(this.kubeConfig);
  }

  get userProfileApi(): IUserProfileApi {
    return new UserProfileApiService(this.kubeConfig);
  }

  get logsApi(): ILogsApi {
    return new LogsApiService(this.kubeConfig);
  }

  get personalAccessTokenApi(): IPersonalAccessTokenApi {
    return new PersonalAccessTokenService(this.kubeConfig);
  }

  get gitConfigApi(): IGitConfigApi {
    return new GitConfigApiService(this.kubeConfig);
  }

  get gettingStartedSampleApi(): IGettingStartedSampleApi {
    return new GettingStartedSamplesApiService(this.kubeConfig);
  }

  get airGapSampleApi(): IAirGapSampleApi {
    return new AirGapSampleApiService();
  }

  get editorsApi(): IEditorsApi {
    return new EditorsApiService();
  }

  get sshKeysApi(): IShhKeysApi {
    return new SshKeysService(this.kubeConfig);
  }

  get workspacePreferencesApi(): IWorkspacePreferencesApi {
    return new WorkspacePreferencesApiService(this.kubeConfig);
  }
}

let devWorkspaceSingletonClient: DevWorkspaceSingletonClient;

/**
 * Singleton client for devworkspace services.
 */
export class DevWorkspaceSingletonClient implements IDevWorkspaceSingletonClient {
  static getInstance(kc: k8s.KubeConfig): DevWorkspaceSingletonClient {
    if (!devWorkspaceSingletonClient) {
      devWorkspaceSingletonClient = new DevWorkspaceSingletonClient(kc);
    }
    return devWorkspaceSingletonClient;
  }

  public readonly devWorkspaceClusterServiceApi: IDevWorkspaceClusterApi;
  private constructor(kc: k8s.KubeConfig) {
    this.devWorkspaceClusterServiceApi = new DevWorkspaceClusterApiService(kc);
  }
}
