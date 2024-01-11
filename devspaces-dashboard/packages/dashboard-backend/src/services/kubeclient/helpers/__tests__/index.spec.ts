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

import * as k8s from '@kubernetes/client-node';

import { isOpenShift } from '@/services/kubeclient/helpers';

const mockFindApi = jest.fn();
jest.mock('@/helpers/findApi', () => ({
  findApi: jest.fn().mockImplementation(() => mockFindApi()),
}));

describe('isOpenShift', () => {
  it('should return true if project.openshift.io API is available', async () => {
    mockFindApi.mockResolvedValue(true);

    const res = await isOpenShift({} as k8s.ApisApi);

    expect(res).toBe(true);
  });

  it('should return false if project.openshift.io API is not available', async () => {
    mockFindApi.mockResolvedValue(false);

    const res = await isOpenShift({} as k8s.ApisApi);

    expect(res).toBe(false);
  });

  it('should throw an error if findApi throws an error', async () => {
    mockFindApi.mockRejectedValue(new Error('find-api-error'));

    await expect(isOpenShift({} as k8s.ApisApi)).rejects.toThrow(
      `Can't evaluate target platform: find-api-error`,
    );
  });
});
