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

import { injectable } from 'inversify';
import { default as WorkspaceClientLib, IRemoteAPI } from '@eclipse-che/workspace-client';

/**
 * This class manages the api connection.
 */
@injectable()
export class CheWorkspaceClient {
  private baseUrl: string;
  private _restApiClient: IRemoteAPI;

  /**
   * Default constructor that is using resource.
   */
  constructor() {
    this.baseUrl = '/api';
  }

  get restApiClient(): IRemoteAPI {
    // Lazy initialization of restApiClient
    if (!this._restApiClient) {
      this.updateRestApiClient();
    }
    return this._restApiClient;
  }

  updateRestApiClient(): void {
    const baseUrl = this.baseUrl;
    this._restApiClient = WorkspaceClientLib.getRestApi({ baseUrl });
  }
}
