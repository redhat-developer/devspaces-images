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

import common from '@eclipse-che/common';

import { fetchData } from '@/services/registry/fetchData';
import { isDevfileMetaData } from '@/services/registry/types';
import SessionStorageService, { SessionStorageKey } from '@/services/session-storage';

const EXPIRATION_TIME_FOR_STORED_METADATA = 60 * 60 * 1000; // expiration time in milliseconds

export class DevfileMetaDataIsNotArrayError extends Error {
  public location: string;

  constructor(location: string) {
    super('Returned value is not array.');
    this.location = location;
  }
}

function createURL(url: string, baseUrl: string): URL {
  if (/^\/(\w+)/.test(url)) {
    return new URL(`.${url}`, baseUrl);
  }

  return new URL(url, baseUrl);
}

function resolveIconUrl(
  metadata: che.DevfileMetaData,
  baseUrl: string,
): string | { base64data: string; mediatype: string } {
  if (typeof metadata.icon === 'string') {
    if (!metadata.icon || metadata.icon.startsWith('http')) {
      return metadata.icon;
    }

    return createURL(metadata.icon, baseUrl).href;
  }

  return metadata.icon;
}

export function convertIconToSrc(icon: che.DevfileMetaData['icon']): string {
  if (typeof icon === 'string') {
    return icon;
  }

  return 'data:' + icon.mediatype + ';base64,' + icon.base64data;
}

export function resolveTags(
  metadata: che.DevfileMetaData,
  baseUrl: string,
  isExternal: boolean,
): string[] {
  const resolvedTags: string[] = [...metadata.tags];
  if (isExternal) {
    const resourceTag = new URL(baseUrl).host
      .replace(/^registry\./, '')
      .replace(/^\w/, char => char.toUpperCase());
    resolvedTags.push(resourceTag);
  }
  return resolvedTags;
}

export function resolveLinks(
  metadata: che.DevfileMetaData,
  baseUrl: string,
  isExternal: boolean,
): any {
  if (isExternal) {
    const self = metadata.links?.self;
    if (self && !metadata.links.v2) {
      const devfileCatalog = new URL('devfiles', baseUrl).toString();
      const v2 = self.startsWith('devfile-catalog')
        ? self.replace(':', '/').replace('devfile-catalog', devfileCatalog)
        : self;
      metadata.links.v2 = v2;
      delete metadata.links.self;
    }
  }

  if (metadata.url) {
    metadata.links = { v2: metadata.url };
    delete metadata.url;
  }

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

export function getRegistryIndexLocations(registryUrl: string, isExternal: boolean): Array<string> {
  registryUrl = registryUrl[registryUrl.length - 1] === '/' ? registryUrl : registryUrl + '/';
  const registryIndexLocations: Array<string> = [];
  if (isExternal) {
    const indexUrl = new URL('index', registryUrl);
    registryIndexLocations.push(indexUrl.href);

    const deprecatedIndexUrl = new URL('devfiles/index.json', registryUrl);
    registryIndexLocations.push(deprecatedIndexUrl.href);
  } else {
    if (registryUrl.endsWith('/getting-started-sample/')) {
      const indexUrl = new URL(registryUrl.slice(0, -1));
      registryIndexLocations.push(indexUrl.href);
    } else {
      const indexUrl = new URL('devfiles/index.json', registryUrl);
      registryIndexLocations.push(indexUrl.href);
    }
  }

  return registryIndexLocations;
}

export async function fetchRegistryMetadata(
  registryUrl: string,
  isExternal: boolean,
): Promise<che.DevfileMetaData[]> {
  try {
    const registryIndexLocations = getRegistryIndexLocations(registryUrl, isExternal);
    if (isExternal) {
      const devfileMetaDataArr = getExternalRegistryMetadataFromStorage(registryIndexLocations[0]);
      if (devfileMetaDataArr !== undefined) {
        return devfileMetaDataArr;
      }
    }

    const devfileMetaDataArr: che.DevfileMetaData[] = [];
    for (const [index, location] of registryIndexLocations.entries()) {
      try {
        const data = await fetchData(location);
        if (Array.isArray(data)) {
          data.forEach(metadata => {
            if (metadata.url) {
              if (!metadata.links) {
                metadata.links = {};
              }
              metadata.links.v2 = metadata.url;
              delete metadata.url;
            }
            if (isDevfileMetaData(metadata)) {
              devfileMetaDataArr.push(metadata);
            } else {
              console.warn(
                `Returns type from registry URL: ${registryUrl} is not DevfileMetaData.`,
                metadata,
              );
            }
          });
          break;
        } else {
          throw new DevfileMetaDataIsNotArrayError(location);
        }
      } catch (e) {
        if (index === registryIndexLocations.length - 1) {
          throw e;
        }
      }
    }

    const val = devfileMetaDataArr.map(meta => {
      meta.icon = resolveIconUrl(meta, registryUrl);
      meta.links = resolveLinks(meta, registryUrl, isExternal);
      meta.tags = resolveTags(meta, registryUrl, isExternal);
      return meta;
    });
    if (isExternal) {
      setExternalRegistryMetadataToStorage(registryIndexLocations[0], val);
    }
    return val;
  } catch (error) {
    const errorMessage =
      `Failed to fetch devfiles metadata from registry URL: ${registryUrl}, reason: ` +
      common.helpers.errors.getMessage(error);
    console.error(errorMessage);
    throw errorMessage;
  }
}

function getExternalRegistryMetadataFromStorage(url: string): che.DevfileMetaData[] | undefined {
  const externalRegistries = SessionStorageService.get(SessionStorageKey.EXTERNAL_REGISTRIES);
  if (typeof externalRegistries !== 'string') {
    return undefined;
  }
  try {
    const externalRegistriesObj = JSON.parse(externalRegistries);
    if (!externalRegistriesObj[url]?.lastFetched || !externalRegistriesObj[url]?.metadata) {
      return undefined;
    }
    const timeElapsed = Date.now() - externalRegistriesObj[url]?.lastFetched;
    if (timeElapsed > EXPIRATION_TIME_FOR_STORED_METADATA) {
      return undefined;
    }
    return externalRegistriesObj[url]?.metadata;
  } catch (e) {
    return undefined;
  }
}

function setExternalRegistryMetadataToStorage(url: string, metadata: che.DevfileMetaData[]): void {
  const externalRegistries = SessionStorageService.get(SessionStorageKey.EXTERNAL_REGISTRIES);
  let externalRegistriesObj: {
    [url: string]: {
      metadata: che.DevfileMetaData[];
      lastFetched: number;
    };
  };
  if (typeof externalRegistries === 'string') {
    try {
      externalRegistriesObj = JSON.parse(externalRegistries);
    } catch (e) {
      externalRegistriesObj = {};
    }
  } else {
    externalRegistriesObj = {};
  }
  externalRegistriesObj[url] = {
    metadata,
    lastFetched: Date.now(),
  };
  try {
    SessionStorageService.update(
      SessionStorageKey.EXTERNAL_REGISTRIES,
      JSON.stringify(externalRegistriesObj),
    );
  } catch (e) {
    // noop
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
