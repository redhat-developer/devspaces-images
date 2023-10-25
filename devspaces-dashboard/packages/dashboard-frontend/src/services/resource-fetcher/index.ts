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

import { getAxiosInstance } from '@/services/axios-wrapper/getAxiosInstance';
import { appendLink } from '@/services/resource-fetcher/appendLink';
import { AppState } from '@/store';

// source: https://github.com/eclipse/che-dashboard/blob/381ff548a9fff3537f1a29ce8e9b228f6c145338/src/components/service/resource-fetcher/resource-fetcher.service.ts

export type ResourceEntry = {
  chunk: string;
  cdn: string;
};

export class ResourceFetcherService {
  public async prefetchResources(state: AppState): Promise<void> {
    const prefetch = state.branding.data.configuration.prefetch;
    if (!prefetch) {
      return;
    }

    await this.prefetchCheCDNResources(prefetch.cheCDN);
    this.prefetchOtherResources(prefetch.resources);
  }

  /**
   * Prefetch Che specific resources.
   */
  private async prefetchCheCDNResources(url?: string): Promise<void> {
    if (!url) {
      return;
    }
    const axiosInstance = getAxiosInstance();
    try {
      const response = await axiosInstance.get<ResourceEntry[]>(url, {
        headers: {
          'Cache-Control': 'no-cache',
          Expires: '0',
        },
      });

      if (!response.data || Array.isArray(response.data) === false) {
        return;
      }
      response.data.forEach(entry => {
        // load the url
        if (entry.cdn) {
          appendLink(entry.cdn);
        } else {
          console.error('Unable to find the Theia resource file to cache');
        }
      });
    } catch (e) {
      console.log('Unable to find Theia CDN resources to cache', e);
    }
  }

  /**
   * Prefetch other resources
   */
  private prefetchOtherResources(resources: string[]): void {
    if (!resources || resources.length === 0) {
      return;
    }
    resources.forEach(resource => {
      appendLink(resource);
    });
  }
}
