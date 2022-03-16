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

import { ApisApi, Context, KubeConfig, User } from '@kubernetes/client-node';
import * as helper from './helpers';
import { isLocalRun } from '../../local-run';

export class KubeConfigProvider {
  private isOpenShift: Promise<boolean>;
  private inClusterKubeConfig: KubeConfig | undefined;

  constructor() {
    const kc: any = this.getSAKubeConfig();
    const apiClient = kc.makeApiClient(ApisApi);
    this.isOpenShift = helper.isOpenShift(apiClient);
  }

  getKubeConfig(token: string): KubeConfig {
    const baseKc = this.getSAKubeConfig();
    const currentContext = baseKc.getContextObject(baseKc.getCurrentContext());
    if (!currentContext) {
      throw 'SA kubecofig is not a valid: no current context is found';
    }
    const currentCluster = baseKc.getCluster(currentContext.cluster);
    if (!currentCluster) {
      throw 'base kubeconfig is not a valid: no cluster exists specified in the current context';
    }

    let name: string;
    try {
      const tokenPayload = token.split('.')[1];
      const decodedTokenPayload = Buffer.from(tokenPayload, 'base64').toString();
      const parsedTokenPayload = JSON.parse(decodedTokenPayload);
      name = parsedTokenPayload.name;
    } catch (error) {
      name = 'developer';
    }

    const user: User = {
      name,
      token: token,
    };
    const context: Context = {
      user: user.name,
      cluster: currentContext.cluster,
      name: 'logged-user',
    };

    const kubeconfig = new KubeConfig();
    kubeconfig.addUser(user);
    kubeconfig.addCluster(currentCluster);
    kubeconfig.addContext(context);
    kubeconfig.setCurrentContext(context.name);
    return kubeconfig;
  }

  getSAKubeConfig(): KubeConfig {
    if (isLocalRun) {
      const kc = new KubeConfig();
      let kubeConfigFile = process.env['KUBECONFIG'];
      if (!kubeConfigFile) {
        // if not kubeconfig env var is defined and fallback kubectl default value: $HOME/.kube/config
        kubeConfigFile = process.env['HOME'] + '/.kube/config';
      }
      kc.loadFromFile(kubeConfigFile);
      return kc;
    } else {
      if (!this.inClusterKubeConfig) {
        this.inClusterKubeConfig = new KubeConfig();
        this.inClusterKubeConfig.loadFromCluster();
      }
      return this.inClusterKubeConfig;
    }
  }
}
