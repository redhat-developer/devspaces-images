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

import common, { api } from '@eclipse-che/common';
import { ValidatedOptions } from '@patternfly/react-core';
import { isEqual } from 'lodash';

import {
  getGitRemotes,
  GitRemote,
  gitRemotesToParam,
} from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/getGitRemotes';
import { buildFactoryLoaderPath } from '@/preload/main';
import { FactoryLocationAdapter } from '@/services/factory-location-adapter';

const BR_NAME_REGEX = /^[0-9A-Za-z-./_]{1,256}$/;

export function validateBrName(name: string): ValidatedOptions {
  if (BR_NAME_REGEX.test(name)) {
    return ValidatedOptions.success;
  }
  return ValidatedOptions.error;
}

export function validateLocation(location: string, hasSshKeys: boolean): ValidatedOptions {
  location = location.trim();
  const isValidHttp = FactoryLocationAdapter.isHttpLocation(location);
  const isValidGitSsh = FactoryLocationAdapter.isSshLocation(location);
  if (isValidHttp) {
    return ValidatedOptions.success;
  }
  if (isValidGitSsh && hasSshKeys) {
    return ValidatedOptions.success;
  }
  return ValidatedOptions.error;
}

export const supportedProviders: api.GitProvider[] = [
  'github',
  'gitlab',
  'bitbucket-server',
  'azure-devops',
];

export function getSupportedGitService(location: string): api.GitProvider {
  const url = new URL(location);
  const provider = supportedProviders.find(p => url.host.includes(p.split('-')[0]));
  if (!provider) {
    throw new Error(`Provider not supported: ${url.host}`);
  }
  return provider;
}

export function isSupportedGitService(location: string): boolean {
  try {
    getSupportedGitService(location);
    return true;
  } catch (error) {
    return false;
  }
}

export function getBranchFromLocation(location: string): string | undefined {
  let branch: string | undefined = undefined;
  const pathname = new URL(location).pathname.replace(/^\//, '').replace(/\/$/, '').split('/');

  const service = getSupportedGitService(location);
  switch (service) {
    case 'github':
      if (pathname[2] === 'tree') {
        branch = pathname.slice(3).join('/');
      }
      break;
    case 'gitlab':
      if (pathname[2] === '-' && pathname[3] === 'tree') {
        branch = pathname.slice(4).join('/');
      }
      break;
    case 'bitbucket-server':
      if (pathname[2] === 'src') {
        branch = pathname.slice(3).join('/');
      }
      break;
    case 'azure-devops':
      branch = getBranchFromAzureDevOpsLocation(location);
      break;
  }

  return branch;
}

/**
 * Returns git branch from the encoded Azure DevOps repo location.
 */
function getBranchFromAzureDevOpsLocation(location: string): string | undefined {
  const url = new URL(location);

  const _location = decodeURIComponent(`${url.origin}${url.pathname}`);
  const _url = new URL(_location);
  const _searchParams = new URLSearchParams(_url.search);

  const version = _searchParams.get('version') || '';
  if (!version || !version.startsWith('GB')) {
    return undefined;
  }

  return version.replace(/^GB/, '');
}

/**
 * Returns updated location which includes Azure DevOps repo location with an encoded version as a param.
 */
function setBranchToAzureDevOpsLocation(location: string, branch: string | undefined): string {
  const url = new URL(location);
  const searchParams = new URLSearchParams(url.search);
  const [pathname, search] = url.pathname.split('%3F');
  const _searchParams = new URLSearchParams(decodeURIComponent(search || ''));
  if (!branch) {
    _searchParams.delete('version');
  } else {
    _searchParams.set('version', `GB${branch}`);
  }
  const encodedParams =
    _searchParams.toString().length === 0 ? '' : encodeURIComponent(`?${_searchParams.toString()}`);
  url.pathname = _searchParams.toString().length === 0 ? pathname : `${pathname}${encodedParams}`;

  return searchParams.toString().length === 0
    ? `${url.origin}${url.pathname}`
    : `${url.origin}${url.pathname}?${searchParams.toString()}`;
}

export function setBranchToLocation(location: string, branch: string | undefined): string {
  const url = new URL(location);
  const pathname = url.pathname;

  const [user, project] = pathname.replace(/^\//, '').replace(/\/$/, '').split('/');

  const service = getSupportedGitService(location);
  if (!branch) {
    if (service === 'azure-devops') {
      url.href = setBranchToAzureDevOpsLocation(location, branch);
    } else {
      url.pathname = `${user}/${project}`;
    }
  } else {
    switch (service) {
      case 'github':
        url.pathname = `${user}/${project}/tree/${branch}`;
        break;
      case 'gitlab':
        url.pathname = `${user}/${project}/-/tree/${branch}`;
        break;
      case 'bitbucket-server':
        url.pathname = `${user}/${project}/src/${branch}`;
        break;
      case 'azure-devops':
        url.href = setBranchToAzureDevOpsLocation(location, branch);
        break;
    }
  }

  return `${url.origin}${url.pathname}${decodeURIComponent(url.search)}`;
}

function getFactoryParamsFromLocation(
  location: string,
  ignoreBranch?: boolean,
): {
  path: string;
  searchParams: URLSearchParams;
} {
  if (
    !ignoreBranch &&
    isSupportedGitService(location) &&
    getSupportedGitService(location) === 'azure-devops'
  ) {
    const url = new URL(location);
    const searchParams = new URLSearchParams(url.search);
    const path = searchParams.get('path');
    const version = searchParams.get('version');
    const repoSearchParams = new URLSearchParams();
    if (path) {
      searchParams.delete('path');
      if (path !== 'true') {
        repoSearchParams.set('path', path);
      }
    }
    if (version) {
      searchParams.delete('version');
      if (version !== 'true') {
        repoSearchParams.set('version', version);
      }
    }
    if (repoSearchParams.toString().length > 0) {
      const encodedParams = encodeURIComponent(`?${repoSearchParams.toString()}`);
      location = `${url.origin}${url.pathname}${encodedParams}?${searchParams.toString()}`;
    }
  }

  const factory = new FactoryLocationAdapter(location);
  const { path } = factory;
  const factoryStr = factory.toString();
  const factoryLoaderPath = buildFactoryLoaderPath(factoryStr, true);
  const params = factoryLoaderPath.split('?')[1] || '';
  const searchParams = new URLSearchParams(params);
  searchParams.delete('url');

  // from override.devfileFilename to devfilePath
  const devfilePath = searchParams.get('override.devfileFilename') || undefined;
  if (devfilePath !== 'true' && devfilePath) {
    searchParams.set('devfilePath', devfilePath);
  }
  if (searchParams.has('override.devfileFilename')) {
    searchParams.delete('override.devfileFilename');
  }

  return { path, searchParams };
}

export function getGitRepoOptionsFromLocation(location: string): {
  location: string | undefined;
  gitBranch: string | undefined;
  remotes: GitRemote[] | undefined;
  devfilePath: string | undefined;
  hasSupportedGitService: boolean;
} {
  const { path, searchParams } = getFactoryParamsFromLocation(location);
  const devfilePath = searchParams.get('devfilePath') || undefined;
  let remotes: GitRemote[] | undefined;
  const _remotes = searchParams.get('remotes') || undefined;
  if (_remotes === 'true' || _remotes === '{}') {
    searchParams.delete('remotes');
    remotes = undefined;
  } else {
    try {
      remotes = getGitRemotes(_remotes);
    } catch (e) {
      console.log(common.helpers.errors.getMessage(e));
    }
  }
  location =
    searchParams.toString().length === 0 ? `${path}` : `${path}?${searchParams.toString()}`;
  const hasSupportedGitService = isSupportedGitService(location);
  let gitBranch = hasSupportedGitService ? getBranchFromLocation(location) : undefined;
  if (hasSupportedGitService) {
    try {
      gitBranch = getBranchFromLocation(location);
    } catch (e) {
      console.log(`Unable to get branch from '${location}'.${common.helpers.errors.getMessage(e)}`);
    }
  }
  return { location, gitBranch, remotes, devfilePath, hasSupportedGitService };
}

export function getAdvancedOptionsFromLocation(location: string): {
  location: string | undefined;
  containerImage: string | undefined;
  temporaryStorage: boolean | undefined;
  createNewIfExisting: boolean | undefined;
  memoryLimit: number | undefined;
  cpuLimit: number | undefined;
} {
  const { path, searchParams } = getFactoryParamsFromLocation(location, true);

  let containerImage = searchParams.get('image') || undefined;
  if (containerImage === '' || containerImage === 'true') {
    searchParams.delete('image');
    containerImage = undefined;
  }

  const _storageType = searchParams.get('storageType');
  let temporaryStorage: boolean | undefined =
    _storageType !== null ? _storageType === 'ephemeral' : undefined;
  if (_storageType === '' || _storageType === 'true') {
    searchParams.delete('storageType');
    temporaryStorage = undefined;
  }

  const _policies_create = searchParams.get('policies.create');
  let createNewIfExisting: boolean | undefined =
    _policies_create !== null ? _policies_create === 'perclick' : undefined;
  if (_policies_create === '' || _policies_create === 'true') {
    searchParams.delete('policies.create');
    createNewIfExisting = undefined;
  }

  let _memoryLimit = searchParams.get('memoryLimit') || undefined;

  if (_memoryLimit === '' || _memoryLimit === 'true') {
    searchParams.delete('memoryLimit');
    _memoryLimit = undefined;
  }
  let memoryLimit = _memoryLimit ? getBytes(_memoryLimit) : undefined;

  if (memoryLimit && isNaN(memoryLimit)) {
    searchParams.delete('memoryLimit');
    memoryLimit = undefined;
  }

  let _cpuLimit = searchParams.get('cpuLimit') || undefined;
  if (_cpuLimit === 'true') {
    searchParams.delete('cpuLimit');
    _cpuLimit = undefined;
  }
  let cpuLimit = _cpuLimit ? parseInt(_cpuLimit) : undefined;
  if (cpuLimit && isNaN(cpuLimit)) {
    searchParams.delete('cpuLimit');
    cpuLimit = undefined;
  }

  location =
    searchParams.toString().length === 0 ? `${path}` : `${path}?${searchParams.toString()}`;

  return {
    location,
    containerImage,
    temporaryStorage,
    createNewIfExisting,
    memoryLimit,
    cpuLimit,
  };
}

export interface IGitRepoOptions {
  location?: string;
  gitBranch?: string | undefined;
  remotes?: GitRemote[] | undefined;
  devfilePath?: string | undefined;
}

export function setGitRepoOptionsToLocation(
  newOptions: IGitRepoOptions,
  currentOptions: IGitRepoOptions,
): IGitRepoOptions {
  const state: IGitRepoOptions = {};
  let location = currentOptions.location;
  if (!location) {
    return newOptions;
  }
  const { path, searchParams } = getFactoryParamsFromLocation(location);

  if (!isEqual(newOptions.remotes, currentOptions.remotes)) {
    state.remotes = newOptions.remotes;
    // update the location with the new remotes values
    if (!newOptions.remotes || newOptions.remotes.length === 0) {
      searchParams.delete('remotes');
    } else {
      const remotesStr = gitRemotesToParam(newOptions.remotes);
      searchParams.set('remotes', remotesStr);
    }
  }

  if (newOptions.devfilePath !== currentOptions.devfilePath) {
    state.devfilePath = newOptions.devfilePath;
  }
  // update the location with the new devfilePath value
  if (searchParams.has('override.devfileFilename')) {
    searchParams.delete('override.devfileFilename');
  }
  if (searchParams.has('df')) {
    searchParams.delete('df');
  }
  if (newOptions.devfilePath) {
    searchParams.set('devfilePath', newOptions.devfilePath);
  } else {
    searchParams.delete('devfilePath');
  }

  if (newOptions.gitBranch !== currentOptions.gitBranch) {
    state.gitBranch = newOptions.gitBranch;
  }
  // update the location with the new gitBranch value
  let searchParamsStr = decodeURIComponent(searchParams.toString());
  const hasSearchParams = searchParamsStr.length > 0;
  if (hasSearchParams) {
    searchParamsStr = decodeURIComponent(searchParamsStr);
  }
  if (isSupportedGitService(location)) {
    location = setBranchToLocation(
      hasSearchParams ? `${path}?${searchParamsStr}` : `${path}`,
      newOptions.gitBranch,
    );
  } else {
    location = hasSearchParams ? `${path}?${searchParamsStr}` : `${path}`;
  }
  // update the location in the state
  state.location = location;

  return state;
}

export interface IAdvancedOptions {
  location?: string;
  containerImage?: string | undefined;
  temporaryStorage?: boolean | undefined;
  createNewIfExisting?: boolean | undefined;
  memoryLimit?: number | undefined;
  cpuLimit?: number | undefined;
}

export function setAdvancedOptionsToLocation(
  newOptions: IAdvancedOptions,
  currentOptions: IAdvancedOptions,
): IAdvancedOptions {
  const state: IAdvancedOptions = {};
  let location = currentOptions.location;
  if (!location) {
    return newOptions;
  }
  const { path, searchParams } = getFactoryParamsFromLocation(location, true);

  if (newOptions.containerImage !== currentOptions.containerImage) {
    state.containerImage = newOptions.containerImage;
    if (newOptions.containerImage) {
      searchParams.set('image', newOptions.containerImage);
    } else {
      searchParams.delete('image');
    }
  }

  if (newOptions.temporaryStorage !== currentOptions.temporaryStorage) {
    state.temporaryStorage = newOptions.temporaryStorage;
    if (newOptions.temporaryStorage) {
      searchParams.set('storageType', 'ephemeral');
    } else if (searchParams.get('storageType') === 'ephemeral') {
      searchParams.delete('storageType');
    }
  }

  if (newOptions.createNewIfExisting !== currentOptions.createNewIfExisting) {
    state.createNewIfExisting = newOptions.createNewIfExisting;
    if (searchParams.has('new')) {
      searchParams.delete('new');
    }
    if (newOptions.createNewIfExisting) {
      searchParams.set('policies.create', 'perclick');
    } else {
      searchParams.delete('policies.create');
    }
  }

  if (newOptions.memoryLimit !== currentOptions.memoryLimit) {
    state.memoryLimit = newOptions.memoryLimit;
    if (newOptions.memoryLimit) {
      const formattedMemoryLimit = formatBytes(newOptions.memoryLimit, 3, true);
      if (formattedMemoryLimit) {
        searchParams.set('memoryLimit', formattedMemoryLimit);
      } else {
        searchParams.delete('memoryLimit');
      }
    } else {
      searchParams.delete('memoryLimit');
    }
  }

  if (newOptions.cpuLimit !== currentOptions.cpuLimit) {
    state.cpuLimit = newOptions.cpuLimit;
    if (newOptions.cpuLimit) {
      searchParams.set('cpuLimit', newOptions.cpuLimit.toString());
    } else {
      searchParams.delete('cpuLimit');
    }
  }

  // update the location with the new gitBranch value
  location = searchParams.toString().length > 0 ? `${path}?${searchParams.toString()}` : `${path}`;
  // update the location in the state
  state.location = location;

  return state;
}

const UNITS_OF_MEASUREMENT = ['', 'K', 'M', 'G', 'T', 'P'];

export function formatBytes(
  bytes: number | undefined,
  decimals = 2,
  binaryUnits = true,
): string | undefined {
  if (!bytes) {
    return undefined;
  }
  const k = binaryUnits ? 1024 : 1000;
  const unitsOfMeasurement = UNITS_OF_MEASUREMENT.map((unit, index) => {
    if (index > 0 && binaryUnits) {
      unit += 'i';
    }
    return unit;
  });
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + unitsOfMeasurement[i];
}

export function getBytes(value: string): number | undefined {
  value = value.trim();
  if (value === '') {
    return undefined;
  }
  const bytes = parseFloat(value);
  if (isNaN(bytes)) {
    return undefined;
  }
  const unitOfMeasurement = value.replace(bytes.toString(), '').trim().toLowerCase();
  if (!unitOfMeasurement) {
    return bytes;
  }
  const k = unitOfMeasurement.match(/ib?$/) !== null ? 1024 : 1000;
  const i = UNITS_OF_MEASUREMENT.map(unit => unit.toLowerCase()).indexOf(unitOfMeasurement[0]);
  if (i === -1) {
    return undefined;
  }
  return bytes * Math.pow(k, i);
}
