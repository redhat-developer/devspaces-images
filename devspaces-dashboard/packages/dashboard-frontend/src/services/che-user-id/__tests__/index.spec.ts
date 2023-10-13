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

import axios from 'axios';

import { fetchCheUserId } from '..';

jest.mock('axios');

describe('fetch Che user ID', () => {
  it('should return Che user ID', async () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: 'user-id',
    });

    const userId = await fetchCheUserId();

    expect(userId).toEqual('user-id');
  });

  it('should throw an error if request failed', async () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.get = jest.fn().mockRejectedValue({
      message: 'che-server-error',
    });

    await expect(fetchCheUserId()).rejects.toThrow('che-server-error');
  });
});
