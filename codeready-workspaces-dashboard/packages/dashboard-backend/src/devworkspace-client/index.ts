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
import { devWorkspaceApiGroup, devworkspaceVersion } from './const';
import {
  ICheApi,
  IDevWorkspaceApi,
  IDevWorkspaceClient,
  IDevWorkspaceTemplateApi,
} from './types';
import { findApi } from './services/helpers';
import { DevWorkspaceTemplateApi } from './services/api/template-api';
import { DevWorkspaceApi } from './services/api/workspace-api';
import { CheApi } from './services/api/che-api';

export * from './types';

export class DevWorkspaceClient implements IDevWorkspaceClient {
  private apiEnabled: boolean | undefined;

  private readonly _apisApi: k8s.ApisApi;
  private readonly _templateApi: IDevWorkspaceTemplateApi;
  private readonly _devworkspaceApi: IDevWorkspaceApi;
  private readonly _cheApi: ICheApi;

  constructor(kc: k8s.KubeConfig) {
    this._templateApi = new DevWorkspaceTemplateApi(kc);
    this._devworkspaceApi = new DevWorkspaceApi(kc);
    this._apisApi = kc.makeApiClient(k8s.ApisApi);
    this._cheApi = new CheApi(kc);
  }

  get templateApi(): IDevWorkspaceTemplateApi {
    return this._templateApi;
  }

  get devworkspaceApi(): IDevWorkspaceApi {
    return this._devworkspaceApi;
  }

  get cheApi(): ICheApi {
    return this._cheApi;
  }

  async isDevWorkspaceApiEnabled(): Promise<boolean> {
    if (this.apiEnabled !== undefined) {
      return Promise.resolve(this.apiEnabled);
    }
    this.apiEnabled = await findApi(this._apisApi, devWorkspaceApiGroup, devworkspaceVersion);
    return this.apiEnabled;
  }
}
