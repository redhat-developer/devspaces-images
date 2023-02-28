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

import { default as WorkspaceClientLib } from '@eclipse-che/workspace-client';
import axios, { AxiosInstance } from 'axios';
import { injectable } from 'inversify';

export const CHE_EDITOR_YAML_PATH = '.che/che-editor.yaml';

/**
 * This class manages the common functions between the che workspace client and the devworkspace client
 */
@injectable()
export abstract class WorkspaceClient {
  protected readonly axios: AxiosInstance;

  protected constructor() {
    // change this temporary solution after adding the proper method to workspace-client https://github.com/eclipse/che/issues/18311
    this.axios = (WorkspaceClientLib as any).createAxiosInstance({ loggingEnabled: false });

    // workspaceClientLib axios interceptor
    this.axios.interceptors.response.use(
      response => response,
      async error => {
        // any status codes that falls outside the range of 2xx
        return Promise.reject(error);
      },
    );

    // dashboard-backend axios interceptor
    axios.interceptors.response.use(
      response => response,
      async error => {
        // any status codes that falls outside the range of 2xx
        return Promise.reject(error);
      },
    );
  }
}
