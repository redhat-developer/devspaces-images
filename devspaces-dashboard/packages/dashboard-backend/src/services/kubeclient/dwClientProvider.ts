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

import { DevWorkspaceClient } from '../../devworkspaceClient';
import { KubeConfigProvider } from './kubeConfigProvider';

export class DwClientProvider {
  private kubeconfigProvider: KubeConfigProvider;

  constructor() {
    this.kubeconfigProvider = new KubeConfigProvider();
  }

  getDWClient(token: string) {
    const contextKc = this.kubeconfigProvider.getKubeConfig(token);

    return new DevWorkspaceClient(contextKc);
  }
}
