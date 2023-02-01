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

/* eslint-disable @typescript-eslint/no-unused-vars */

import * as k8s from '@kubernetes/client-node';

const { KubeConfig } = k8s;
const config = new KubeConfig();
config.makeApiClient = jest.fn();

export function KubeConfigProvider() {
  return {
    getSAKubeConfig: () => config,
    getKubeConfig: (_token: string) => {
      return new KubeConfig();
    },
    inClusterKubeConfig: config,
  };
}
