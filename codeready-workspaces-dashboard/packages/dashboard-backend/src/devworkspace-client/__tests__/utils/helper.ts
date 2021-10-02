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

import { KubeConfig } from '@kubernetes/client-node';

export async function delay(ms = 500): Promise<void> {
  await new Promise<void>(resolve => setTimeout(resolve, ms));
}

export function createKubeConfig(): KubeConfig {
  const kc = new KubeConfig();
  let kubeconfigFile = process.env['KUBECONFIG'];
  if (!kubeconfigFile) {
    kubeconfigFile =  process.env['HOME'] + '/.kube/config';
  }
  kc.loadFromFile(kubeconfigFile);
  return kc;
}
