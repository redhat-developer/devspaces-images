/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import {
  IServerConfigApi,
  IDevWorkspaceApi,
  IDevWorkspaceClient,
  IDevWorkspaceTemplateApi,
  IDockerConfigApi,
  IKubeConfigApi,
  INamespaceApi,
} from './types';
import { DevWorkspaceTemplateApiService } from './services/devWorkspaceTemplateApi';
import { DevWorkspaceApiService } from './services/devWorkspaceApi';
import { DockerConfigApiService } from './services/dockerConfigApi';
import { ServerConfigApiService } from './services/serverConfigApi';
import { KubeConfigApiService } from './services/kubeConfigApi';
import { NamespaceApiService } from './services/namespaceApi';

export * from './types';

export class DevWorkspaceClient implements IDevWorkspaceClient {
  private apiEnabled: boolean | undefined;

  private readonly _apisApi: k8s.ApisApi;
  private readonly _devWorkspaceTemplateApi: IDevWorkspaceTemplateApi;
  private readonly _devworkspaceApi: IDevWorkspaceApi;
  private readonly _dockerConfigApi: IDockerConfigApi;
  private readonly _serverConfigApi: IServerConfigApi;
  private readonly _kubeConfigApi: IKubeConfigApi;
  private readonly _namespaceApi: INamespaceApi;

  constructor(kc: k8s.KubeConfig) {
    this._devWorkspaceTemplateApi = new DevWorkspaceTemplateApiService(kc);
    this._devworkspaceApi = new DevWorkspaceApiService(kc);
    this._dockerConfigApi = new DockerConfigApiService(kc);
    this._serverConfigApi = new ServerConfigApiService(kc);
    this._kubeConfigApi = new KubeConfigApiService(kc);
    this._namespaceApi = new NamespaceApiService(kc);
    this._apisApi = kc.makeApiClient(k8s.ApisApi);
  }

  get devWorkspaceTemplateApi(): IDevWorkspaceTemplateApi {
    return this._devWorkspaceTemplateApi;
  }

  get devworkspaceApi(): IDevWorkspaceApi {
    return this._devworkspaceApi;
  }

  get dockerConfigApi(): IDockerConfigApi {
    return this._dockerConfigApi;
  }

  get serverConfigApi(): IServerConfigApi {
    return this._serverConfigApi;
  }

  get kubeConfigApi(): IKubeConfigApi {
    return this._kubeConfigApi;
  }

  get namespaceApi(): INamespaceApi {
    return this._namespaceApi;
  }
}
