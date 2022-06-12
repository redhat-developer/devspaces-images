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
import { AxiosInstance, AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import { default as WorkspaceClientLib } from '@eclipse-che/workspace-client';
import { isForbidden, isUnauthorized } from './helpers';
export type WebSocketsFailedCallback = () => void;

/**
 * This class manages the common functions between the che workspace client and the devworkspace client
 */
@injectable()
export abstract class WorkspaceClient {
  protected readonly axios: AxiosInstance;

  constructor() {
    // change this temporary solution after adding the proper method to workspace-client https://github.com/eclipse/che/issues/18311
    this.axios = (WorkspaceClientLib as any).createAxiosInstance({ loggingEnabled: false });

    // workspaceClientLib axios interceptor
    this.axios.interceptors.response.use(
      async response => {
        if (
          this.checkPathPrefix(response, '/api/') &&
          (isUnauthorized(response) || isForbidden(response))
        ) {
          await deauthorizeCallback();
        }
        return response;
      },
      async error => {
        if (isUnauthorized(error)) {
          await deauthorizeCallback();
        }
        return Promise.reject(error);
      },
    );

    // dashboard-backend axios interceptor
    axios.interceptors.response.use(
      async response => {
        if (isUnauthorized(response) && this.checkPathPrefix(response, '/dashboard/api/')) {
          await deauthorizeCallback();
        }
        return response;
      },
      async error => {
        if (isUnauthorized(error)) {
          await deauthorizeCallback();
        }
        return Promise.reject(error);
      },
    );
  }

  private checkPathPrefix(response: AxiosResponse, prefix: string): boolean {
    const pathname = response.request?.responseURL;
    if (!pathname) {
      return false;
    }
    return pathname.startsWith(prefix);
  }
}

export async function deauthorizeCallback(): Promise<void> {
  await axios.get('/oauth/sign_out');
  return Promise.resolve();
}
