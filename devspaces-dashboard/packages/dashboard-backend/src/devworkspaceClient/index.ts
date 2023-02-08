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

import * as k8s from '@kubernetes/client-node';
import { DevWorkspaceApiService } from './services/devWorkspaceApi';
import { DevWorkspaceTemplateApiService } from './services/devWorkspaceTemplateApi';
import { DockerConfigApiService } from './services/dockerConfigApi';
import { EventApiService } from './services/eventApi';
import { KubeConfigApiService } from './services/kubeConfigApi';
import { NamespaceApiService } from './services/namespaceApi';
import { PodApiService } from './services/podAPI';
import { ServerConfigApiService } from './services/serverConfigApi';
import { UserProfileApiService } from './services/userProfileApi';
import {
  IDevWorkspaceApi,
  IDevWorkspaceClient,
  IDevWorkspaceTemplateApi,
  IDockerConfigApi,
  IEventApi,
  IKubeConfigApi,
  INamespaceApi,
  IPodApi,
  IServerConfigApi,
  IUserProfileApi,
} from './types';

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

  get namespaceApi(): INamespaceApi {
    return new NamespaceApiService(this.kubeConfig);
  }

  get userProfileApi(): IUserProfileApi {
    return new UserProfileApiService(this.kubeConfig);
  }
}
