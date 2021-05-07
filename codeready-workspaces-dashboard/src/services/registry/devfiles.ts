/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
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

// create new instance of `axios` to avoid adding an authorization header
const axiosInstance = axios.create();

function createURL(url: string, baseUrl: string): URL {

  // todo Remove it after fixing all source links https://github.com/eclipse/che/issues/19140
  if (/^\/(\w+)/.test(url)) {
    return new URL(`.${url}`, baseUrl);
  }

  return new URL(url, baseUrl);
}

function resolveIconUrl(metadata: che.DevfileMetaData, baseUrl: string): string {
  if (!metadata.icon || metadata.icon.startsWith('http')) {
    return metadata.icon;
  }

  return createURL(metadata.icon, baseUrl).href;
}

function resolveLinkSelf(metadata: che.DevfileMetaData, baseUrl: string): string {
  if (metadata.links.self.startsWith('http')) {
    return metadata.links.self;
  }

  return createURL(metadata.links.self, baseUrl).href;
}

export async function fetchMetadata(registryUrl: string): Promise<che.DevfileMetaData[]> {

  try {
    const registryIndexUrl = new URL('devfiles/index.json', registryUrl);
    const response = await axiosInstance.get<che.DevfileMetaData[]>(registryIndexUrl.href);

    return response.data.map(meta => {
      meta.icon = resolveIconUrl(meta, registryUrl);
      meta.links.self = resolveLinkSelf(meta, registryUrl);
      return meta;
    });
  } catch (e) {
    throw new Error(`Failed to fetch devfiles metadata from registry URL: ${registryUrl},` + e);
  }
}

/**
 * Fetches devfiles metadata for given registry urls.
 * @param registryUrls space-separated list of urls
 */
export async function fetchRegistriesMetadata(registryUrls: string): Promise<che.DevfileMetaData[]> {
  const urls = registryUrls.split(/\s+/);

  try {
    const metadataPromises = urls.map(registryUrl => {
      return registryUrl[registryUrl.length - 1] === '/' ? registryUrl : registryUrl + '/';
    }).map(async url => {
      try {
        return await fetchMetadata(url);
      } catch (error) {
        console.error(error);
        return [];
      }
    });

    const allMetadata = await Promise.all(metadataPromises);
    return allMetadata.reduce((_allMetadata, registryMetadata) => {
      return _allMetadata.concat(registryMetadata);
    }, []);
  } catch (e) {
    throw new Error(e);
  }
}

export async function fetchDevfile(url: string): Promise<string> {
  try {
    const response = await axiosInstance.get<string>(url);
    return response.data;
  } catch (e) {
    throw new Error(`Failed to fetch a devfile from URL: ${url},` + e);
  }
}
