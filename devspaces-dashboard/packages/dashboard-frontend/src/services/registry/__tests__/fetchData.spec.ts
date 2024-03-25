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

import axios from 'axios';

import { fetchData } from '@/services/registry/fetchData';

const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();
axios.get = mockAxiosGet;
axios.post = mockAxiosPost;

describe('fetchData', () => {
  beforeEach(() => {
    mockAxiosGet.mockResolvedValue({ data: 'GET data' });
    mockAxiosPost.mockResolvedValue({ data: 'POST data' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should GET data when location is the same origin', async () => {
    await fetchData('http://localhost');

    expect(mockAxiosGet).toHaveBeenCalledWith('http://localhost/');
    expect(mockAxiosGet).toHaveBeenCalledTimes(1);
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it('should POST data when location is not the same origin', async () => {
    await fetchData('http://example.com');

    expect(mockAxiosPost).toHaveBeenCalledWith('/dashboard/api/data/resolver', {
      url: 'http://example.com/',
    });
  });

  it('should throw error when failed to fetch data', async () => {
    const errorMessage = 'Test error message';
    mockAxiosGet.mockRejectedValueOnce(new Error(errorMessage));

    await expect(fetchData('http://localhost')).rejects.toThrow(errorMessage);
  });
});
