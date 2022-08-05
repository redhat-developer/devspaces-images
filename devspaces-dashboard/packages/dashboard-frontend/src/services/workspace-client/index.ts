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

import axios from 'axios';
import { AxiosInstance } from 'axios';
import { injectable } from 'inversify';
import { default as WorkspaceClientLib } from '@eclipse-che/workspace-client';
import { isForbidden, isUnauthorized } from './helpers';
import { signIn } from '../helpers/login';
import common from '@eclipse-che/common';

/**
 * This class manages the common functions between the che workspace client and the devworkspace client
 */
@injectable()
export abstract class WorkspaceClient {
  private sessionCheckAxiosInstance: AxiosInstance;
  private static sessionCheckTimeout: number | undefined;

  protected readonly axios: AxiosInstance;

  protected constructor() {
    this.sessionCheckAxiosInstance = axios.create();
    // change this temporary solution after adding the proper method to workspace-client https://github.com/eclipse/che/issues/18311
    this.axios = (WorkspaceClientLib as any).createAxiosInstance({ loggingEnabled: false });

    // workspaceClientLib axios interceptor
    this.axios.interceptors.response.use(
      response => response,
      async error => {
        // any status codes that falls outside the range of 2xx
        await this.onError(error);
        return Promise.reject(error);
      },
    );

    // dashboard-backend axios interceptor
    axios.interceptors.response.use(
      response => response,
      async error => {
        // any status codes that falls outside the range of 2xx
        await this.onError(error);
        return Promise.reject(error);
      },
    );
  }

  private async onError(error: unknown): Promise<void> {
    if (!isForbidden(error) && !isUnauthorized(error)) {
      return;
    }
    if (!WorkspaceClient.sessionCheckTimeout) {
      try {
        await this.sessionCheckAxiosInstance.get('/api/kubernetes/namespace');
      } catch (e) {
        console.error(common.helpers.errors.getMessage(e));
        WorkspaceClient.sessionCheckTimeout = window.setTimeout(() => {
          WorkspaceClient.sessionCheckTimeout = undefined;
          signIn();
        }, 3000);
      }
    }
  }
}
