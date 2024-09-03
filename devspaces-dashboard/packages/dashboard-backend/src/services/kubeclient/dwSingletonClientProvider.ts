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

import { DevWorkspaceSingletonClient } from '@/devworkspaceClient';
import { getServiceAccountToken } from '@/routes/api/helpers/getServiceAccountToken';
import { KubeConfigProvider } from '@/services/kubeclient/kubeConfigProvider';

let dwSingletonClientProvider: DwSingletonClientProvider;

/**
 * Singleton provider for the DevWorkspaceClient created with service account token.
 */
export class DwSingletonClientProvider {
  static getInstance() {
    if (!dwSingletonClientProvider) {
      dwSingletonClientProvider = new DwSingletonClientProvider();
    }
    return dwSingletonClientProvider;
  }

  private readonly devWorkspaceSingletonClient: DevWorkspaceSingletonClient;

  private constructor() {
    const kubeConfigProvider = new KubeConfigProvider();
    const kubeConfig = kubeConfigProvider.getKubeConfig(getServiceAccountToken());
    this.devWorkspaceSingletonClient = DevWorkspaceSingletonClient.getInstance(kubeConfig);
  }

  /**
   * Returns a singleton instance of the DevWorkspaceClient.
   */
  getDWSingletonClient() {
    return this.devWorkspaceSingletonClient;
  }
}
