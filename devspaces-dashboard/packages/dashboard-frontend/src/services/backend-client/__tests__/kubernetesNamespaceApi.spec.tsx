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

import mockAxios from 'axios';

import {
  getKubernetesNamespace,
  provisionKubernetesNamespace,
} from '@/services/backend-client/kubernetesNamespaceApi';

describe('Kubernetes namespace API', () => {
  const mockGet = mockAxios.get as jest.Mock;
  const mockPost = mockAxios.post as jest.Mock;

  const namespace: che.KubernetesNamespace = { name: 'test-name', attributes: { phase: 'Active' } };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetch namespace', () => {
    it('should call "/api/kubernetes/namespace"', async () => {
      mockGet.mockResolvedValueOnce(new Promise(resolve => resolve({ data: expect.anything() })));
      await getKubernetesNamespace();

      expect(mockGet).toBeCalledWith('/api/kubernetes/namespace', undefined);
      expect(mockPost).not.toBeCalled();
    });

    it('should return a list of namespaces', async () => {
      mockGet.mockResolvedValueOnce(new Promise(resolve => resolve({ data: [namespace] })));

      const res = await getKubernetesNamespace();

      expect(res).toEqual([namespace]);
    });
  });

  describe('provision namespace', () => {
    it('should call "/api/kubernetes/namespace/provision"', async () => {
      mockPost.mockResolvedValueOnce({
        data: expect.anything(),
      });
      await provisionKubernetesNamespace();

      expect(mockGet).not.toBeCalled();
      expect(mockPost).toBeCalledWith('/api/kubernetes/namespace/provision', undefined, undefined);
    });

    it('should return a list of namespaces', async () => {
      mockPost.mockResolvedValueOnce({
        data: [namespace],
      });

      const res = await provisionKubernetesNamespace();

      expect(res).toEqual([namespace]);
    });
  });
});
