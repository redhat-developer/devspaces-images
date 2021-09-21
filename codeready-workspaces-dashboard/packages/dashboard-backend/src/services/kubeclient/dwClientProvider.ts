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
import { KubeConfig } from '@kubernetes/client-node';
import { DevWorkspaceClient } from '../../devworkspace-client';
import * as helper from './helpers';
import { KubeConfigProvider } from './kubeConfigProvider';
import { validateToken } from './keycloak';

export class DwClientProvider {
  private kubeconfigProvider: KubeConfigProvider;
  private readonly isOpenShift: Promise<boolean>;

  constructor() {
    this.kubeconfigProvider = new KubeConfigProvider();

    const kc: any = this.kubeconfigProvider.getSAKubeConfig();
    const apiClient = kc.makeApiClient(k8s.ApisApi);
    this.isOpenShift = helper.isOpenShift(apiClient);
  }

  async getDWClient(token: string) {
    let contextKc: KubeConfig;
    if (await this.isOpenShift) {
      // on OpenShift it's supposed to be access token which we can use directly
      contextKc = this.kubeconfigProvider.getKubeConfig(token);
    } else {
      // on K8s it's supposed to be keycloak token which we can't use to access the cluster
      // so, validate token and use SA
      try {
        await validateToken(token);
      } catch (e) {
        console.error(e);
        throw e;
      }
      contextKc = this.kubeconfigProvider.getSAKubeConfig();
    }
    return new DevWorkspaceClient(contextKc);
  }
}
