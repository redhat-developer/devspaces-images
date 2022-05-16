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
} from './types';
import { findApi } from './services/helpers';
import { DevWorkspaceTemplateApi } from './services/api/template-api';
import { DevWorkspaceApi } from './services/api/workspace-api';
import { devworkspaceGroup, devworkspaceLatestVersion } from '@devfile/api';
import { DockerConfigApi } from './services/api/dockerConfigApi';
import { ServerConfigApi } from './services/api/serverConfigApi';
import { KubeConfigApi } from './services/api/kubeConfigApi';

export * from './types';

export class DevWorkspaceClient implements IDevWorkspaceClient {
  private apiEnabled: boolean | undefined;

  private readonly _apisApi: k8s.ApisApi;
  private readonly _templateApi: IDevWorkspaceTemplateApi;
  private readonly _devworkspaceApi: IDevWorkspaceApi;
  private readonly _dockerConfigApi: IDockerConfigApi;
  private readonly _serverConfigApi: IServerConfigApi;
  private readonly _kubeConfigApi: IKubeConfigApi;

  constructor(kc: k8s.KubeConfig) {
    this._templateApi = new DevWorkspaceTemplateApi(kc);
    this._devworkspaceApi = new DevWorkspaceApi(kc);
    this._dockerConfigApi = new DockerConfigApi(kc);
    this._serverConfigApi = new ServerConfigApi(kc);
    this._kubeConfigApi = new KubeConfigApi(kc);
    this._apisApi = kc.makeApiClient(k8s.ApisApi);
  }

  get templateApi(): IDevWorkspaceTemplateApi {
    return this._templateApi;
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

  async isDevWorkspaceApiEnabled(): Promise<boolean> {
    if (this.apiEnabled !== undefined) {
      return Promise.resolve(this.apiEnabled);
    }
    this.apiEnabled = await findApi(this._apisApi, devworkspaceGroup, devworkspaceLatestVersion);
    return this.apiEnabled;
  }
}
