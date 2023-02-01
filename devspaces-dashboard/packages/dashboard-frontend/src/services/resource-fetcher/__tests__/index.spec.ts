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
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { BrandingData } from '../../bootstrap/branding.constant';
import { ResourceFetcherService } from '..';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.get = jest.fn();

// mute the outputs
console.log = jest.fn();

describe('Resource fetcher', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not request resources if nothing configured', () => {
    const service = new ResourceFetcherService();
    jest.spyOn(service as any, 'appendLink');

    const store = new FakeStoreBuilder()
      .withBranding({
        configuration: {},
      } as BrandingData)
      .build();
    service.prefetchResources(store.getState());

    expect(mockedAxios.get).not.toHaveBeenCalled();
    expect((service as any).appendLink).not.toHaveBeenCalled();
  });

  it('should request CheCDN resources', async () => {
    const service = new ResourceFetcherService();
    jest.spyOn(service as any, 'appendLink');

    mockedAxios.get = jest.fn().mockResolvedValue({
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

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('che/cdn', expect.anything());

    expect((service as any).appendLink).toHaveBeenCalledTimes(3);
    expect((service as any).appendLink).toHaveBeenCalledWith('che/resource/1');
    expect((service as any).appendLink).toHaveBeenCalledWith('che/resource/2');
    expect((service as any).appendLink).toHaveBeenCalledWith('che/resource/3');
  });

  it('should request other resources', async () => {
    const service = new ResourceFetcherService();
    jest.spyOn(service as any, 'appendLink');

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

    expect(mockedAxios.get).not.toHaveBeenCalled();

    expect((service as any).appendLink).toHaveBeenCalledTimes(3);
    expect((service as any).appendLink).toHaveBeenCalledWith('other/resource/1');
    expect((service as any).appendLink).toHaveBeenCalledWith('other/resource/2');
    expect((service as any).appendLink).toHaveBeenCalledWith('other/resource/3');
  });
});
