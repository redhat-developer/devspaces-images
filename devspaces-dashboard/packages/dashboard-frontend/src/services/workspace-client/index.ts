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
import { signIn } from '../helpers/login';

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
        const isApi = this.checkPathPrefix(response, '/api/');
        if (isApi) {
          if (isUnauthorized(response) || isForbidden(response)) {
            signIn();
          }
        }
        return response;
      },
      async error => {
        if (isUnauthorized(error) || isForbidden(error)) {
          signIn();
        }
        return Promise.reject(error);
      },
    );

    // dashboard-backend axios interceptor
    axios.interceptors.response.use(
      async response => {
        const isApi = this.checkPathPrefix(response, '/dashboard/api/');
        if (isApi) {
          if (isUnauthorized(response) || isForbidden(response)) {
            signIn();
          }
        }
        return response;
      },
      async error => {
        if (isUnauthorized(error) || isForbidden(error)) {
          signIn();
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
