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

import { KubeConfigProvider } from '../kubeConfigProvider';
import * as mockClient from '@kubernetes/client-node';

describe('K8s Configuration Provider', () => {
  const env = process.env;

  let spyLoadFromCluster: jest.SpyInstance;
  let spyGetContextObject: jest.SpyInstance;
  let spyGetCluster: jest.SpyInstance;

  const stubContextObject = {
    cluster: 'current-cluster',
    name: 'current-cluster',
    user: 'current-cluster',
  };
  const stubCluster = {
    name: 'current-cluster',
    server: 'server-url',
    skipTLSVerify: false,
  };

  beforeEach(() => {
    jest.resetModules();

    const { KubeConfig } = mockClient;
    spyLoadFromCluster = jest.spyOn(KubeConfig.prototype, 'loadFromCluster').mockReturnValue();
    spyGetContextObject = jest
      .spyOn(KubeConfig.prototype, 'getContextObject')
      .mockImplementation(() => stubContextObject);
    spyGetCluster = jest.spyOn(KubeConfig.prototype, 'getCluster').mockReturnValue(stubCluster);
  });

  afterEach(() => {
    process.env = env;
    jest.clearAllMocks();
  });

  describe('production mode', () => {
    test('load configuration from cluster', () => {
      const provider = new KubeConfigProvider();
      provider.getSAKubeConfig();

      expect(spyLoadFromCluster).toHaveBeenCalled();
    });

    test('build k8s config', () => {
      const provider = new KubeConfigProvider();

      const config = provider.getKubeConfig('token');

      expect(spyLoadFromCluster).toHaveBeenCalled();
      expect(spyGetContextObject).toHaveBeenCalled();
      expect(spyGetCluster).toHaveBeenCalled();

      expect(config.contexts.length).toEqual(1);
      expect(config.contexts[0].user).toEqual('developer');
      expect(config.contexts[0].cluster).toEqual('current-cluster');
      expect(config.contexts[0].name).toEqual('logged-user');

      expect(config.clusters.length).toEqual(1);
      expect(config.clusters[0]).toEqual(stubCluster);

      expect(config.users.length).toEqual(1);
      expect(config.currentContext).toEqual('logged-user');
    });
  });
});
