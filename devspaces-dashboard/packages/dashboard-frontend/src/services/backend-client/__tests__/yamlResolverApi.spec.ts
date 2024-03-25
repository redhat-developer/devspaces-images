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

import { getYamlResolver } from '@/services/backend-client/yamlResolverApi';

// mock fetchData
const mockFetchData = jest.fn();
jest.mock('@/services/registry/fetchData', () => ({
  fetchData: (...args: unknown[]) => mockFetchData(...args),
}));

describe('yamlResolverApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve yaml', async () => {
    mockFetchData.mockResolvedValue('schemaVersion: 2.2.2\nmetadata:\n  name: test');

    const yamlResolver = await getYamlResolver('location');
    expect(yamlResolver).toEqual({
      v: 'yaml-resolver',
      devfile: {
        schemaVersion: '2.2.2',
        metadata: {
          name: 'test',
        },
      },
      links: [],
      location: 'location',
    });
  });

  it('should throw error when failed to resolve yaml', async () => {
    mockFetchData.mockRejectedValue(new Error('error message'));

    await expect(getYamlResolver('location')).rejects.toThrow(
      'Failed to resolve yaml. error message',
    );
  });
});
