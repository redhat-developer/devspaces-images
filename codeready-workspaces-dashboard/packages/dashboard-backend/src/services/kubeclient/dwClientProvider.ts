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
import { validateToken, evaluateKeycloakEndpointUrl } from './keycloak';
import { helpers } from '@eclipse-che/common';

const ERROR_INVALID_URL = 'ERR_INVALID_URL';

export class DwClientProvider {
  private static keycloakEndpoint: string | undefined;
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
      if (DwClientProvider.keycloakEndpoint === undefined) {
        try {
          DwClientProvider.keycloakEndpoint = await evaluateKeycloakEndpointUrl();
        } catch (e) {
          if (
            helpers.errors.isAxiosError(e) &&
            helpers.errors.isAxiosResponse(e.response) &&
            e.response.status !== 401 &&
            e.response.status !== 404
          ) {
            throw e;
          }
          DwClientProvider.keycloakEndpoint = ERROR_INVALID_URL;
          console.log(
            "Cannot evaluate keycloak user's endpoint. It could be with native auth mode.",
          );
        }
      }
      if (DwClientProvider.keycloakEndpoint != ERROR_INVALID_URL) {
        // if it supposed to be keycloak token on K8s which we can't use to access the cluster
        // so, validate token and use SA
        await validateToken(DwClientProvider.keycloakEndpoint, token);
        contextKc = this.kubeconfigProvider.getSAKubeConfig();
      } else {
        contextKc = this.kubeconfigProvider.getKubeConfig(token);
      }
    }

    return new DevWorkspaceClient(contextKc);
  }
}
