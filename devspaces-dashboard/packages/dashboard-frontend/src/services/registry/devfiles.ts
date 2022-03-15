/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import common from '@eclipse-che/common';

// create new instance of `axios` to avoid adding an authorization header
const axiosInstance = axios.create();

function createURL(url: string, baseUrl: string): URL {
  // Remove it after fixing all source links https://github.com/eclipse/che/issues/19140
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

export function resolveLinks(metadata: che.DevfileMetaData, baseUrl: string): any {
  const resolvedLinks = {};
  const linkNames = Object.keys(metadata.links);
  linkNames.map(linkName => {
    resolvedLinks[linkName] = updateObjectLinks(metadata.links[linkName], baseUrl);
  });
  return resolvedLinks;
}

export function updateObjectLinks(object: any, baseUrl): any {
  if (typeof object === 'string') {
    if (!object.startsWith('http')) {
      object = createURL(object, baseUrl).href;
    }
  } else {
    Object.keys(object).forEach(key => {
      object[key] = updateObjectLinks(object[key], baseUrl);
    });
  }
  return object;
}

export async function fetchData<T>(url: string): Promise<T> {
  try {
    const response = await axiosInstance.get<T>(url);
    return response.data;
  } catch (e) {
    throw common.helpers.errors.getMessage(e);
  }
}

export async function fetchRegistryMetadata(registryUrl: string): Promise<che.DevfileMetaData[]> {
  registryUrl = registryUrl[registryUrl.length - 1] === '/' ? registryUrl : registryUrl + '/';

  try {
    const registryIndexUrl = new URL('devfiles/index.json', registryUrl);
    const devfileMetaData = await fetchData<che.DevfileMetaData[]>(registryIndexUrl.href);

    return devfileMetaData.map(meta => {
      meta.icon = resolveIconUrl(meta, registryUrl);
      meta.links = resolveLinks(meta, registryUrl);
      return meta;
    });
  } catch (error) {
    const errorMessage =
      `Failed to fetch devfiles metadata from registry URL: ${registryUrl}, reason: ` + error;
    console.error(errorMessage);
    throw errorMessage;
  }
}

export async function fetchDevfile(url: string): Promise<string> {
  try {
    const devfile = await fetchData<string>(url);
    return devfile;
  } catch (error) {
    const errorMessage = `Failed to fetch a devfile from URL: ${url}, reason: ` + error;
    console.error(errorMessage);
    throw errorMessage;
  }
}
