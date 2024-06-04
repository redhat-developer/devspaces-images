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

import common from '@eclipse-che/common';
import { AxiosError } from 'axios';
import mockAxios from 'axios';

import { fetchEditors } from '@/services/backend-client/editorsApi';
import devfileApi from '@/services/devfileApi';

const editors = [
  {
    metadata: {
      name: 'default-editor',
      attributes: {
        publisher: 'che-incubator',
        version: 'latest',
      },
    },
    schemaVersion: '2.2.2',
  } as devfileApi.Devfile,
  {
    metadata: {
      name: 'che-code',
      attributes: {
        publisher: 'che-incubator',
        version: 'insiders',
      },
    },
    schemaVersion: '2.2.2',
  } as devfileApi.Devfile,
];

const mockFetchEditors = mockAxios.get as jest.Mock;

describe('Fetch Editors Api', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch editors', async () => {
    mockFetchEditors.mockResolvedValueOnce({ data: editors });

    const fetchedEditors = await fetchEditors();
    expect(fetchedEditors).toEqual(editors);
  });

  it('should throw error when failed to fetch editors', async () => {
    mockFetchEditors.mockRejectedValueOnce({
      code: '500',
      message: 'error message',
    } as AxiosError);
    let errorMessage: string | undefined;
    try {
      await fetchEditors();
    } catch (err) {
      errorMessage = common.helpers.errors.getMessage(err);
    }

    expect(errorMessage).toEqual('Failed to fetch editors. error message');
  });
});
