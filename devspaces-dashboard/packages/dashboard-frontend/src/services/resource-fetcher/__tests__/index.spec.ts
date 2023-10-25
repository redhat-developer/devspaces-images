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

import { BrandingData } from '@/services/bootstrap/branding.constant';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

import { ResourceFetcherService } from '..';

const mockedAppendLink = jest.fn();
jest.mock('@/services/resource-fetcher/appendLink', () => {
  return {
    appendLink: (...args) => mockedAppendLink(...args),
  };
});
const mockedGet = jest.fn();
jest.mock('@/services/axios-wrapper/getAxiosInstance', () => {
  return {
    getAxiosInstance: () => ({
      get: (...args) => mockedGet(...args),
      post: (...args) => jest.fn(...args),
      patch: (...args) => jest.fn(...args),
    }),
  };
});

// mute the outputs
console.log = jest.fn();

describe('Resource fetcher', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not request resources if nothing configured', () => {
    const service = new ResourceFetcherService();
    const store = new FakeStoreBuilder()
      .withBranding({
        configuration: {},
      } as BrandingData)
      .build();
    service.prefetchResources(store.getState());

    expect(mockedGet).not.toHaveBeenCalled();
    expect(mockedAppendLink).not.toHaveBeenCalled();
  });

  it('should request CheCDN resources', async () => {
    const service = new ResourceFetcherService();

    mockedGet.mockResolvedValueOnce({
      data: [
        { cdn: 'che/resource/1', chunk: 'resource-1' },
        { cdn: 'che/resource/2', chunk: 'resource-2' },
        { cdn: 'che/resource/3', chunk: 'resource-3' },
      ],
    });

    const store = new FakeStoreBuilder()
      .withBranding({
        configuration: {
          prefetch: {
            cheCDN: 'che/cdn',
          },
        },
      } as BrandingData)
      .build();
    await service.prefetchResources(store.getState());

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet).toHaveBeenCalledWith('che/cdn', expect.anything());

    expect(mockedAppendLink).toHaveBeenCalledTimes(3);
    expect(mockedAppendLink).toHaveBeenCalledWith('che/resource/1');
    expect(mockedAppendLink).toHaveBeenCalledWith('che/resource/2');
    expect(mockedAppendLink).toHaveBeenCalledWith('che/resource/3');
  });

  it('should request other resources', async () => {
    const service = new ResourceFetcherService();

    const store = new FakeStoreBuilder()
      .withBranding({
        configuration: {
          prefetch: {
            resources: ['other/resource/1', 'other/resource/2', 'other/resource/3'],
          },
        },
      } as BrandingData)
      .build();
    await service.prefetchResources(store.getState());

    expect(mockedGet).not.toHaveBeenCalled();

    expect(mockedAppendLink).toHaveBeenCalledTimes(3);
    expect(mockedAppendLink).toHaveBeenCalledWith('other/resource/1');
    expect(mockedAppendLink).toHaveBeenCalledWith('other/resource/2');
    expect(mockedAppendLink).toHaveBeenCalledWith('other/resource/3');
  });
});
