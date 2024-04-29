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

import { api } from '@eclipse-che/common';
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

export const supportedProviders: api.GitOauthProvider[] = ['github', 'gitlab', 'bitbucket'];

export function getSupportedGitService(location: string): api.GitOauthProvider {
  const url = new URL(location);
  const provider = supportedProviders.find(p => url.host.includes(p));
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
    case 'bitbucket':
      if (pathname[2] === 'src') {
        branch = pathname.slice(3).join('/');
      }
      break;
  }

  return branch;
}

export function setBranchToLocation(location: string, branch: string | undefined): string {
  const url = new URL(location);
  const pathname = url.pathname;

  const [user, project] = pathname.replace(/^\//, '').replace(/\/$/, '').split('/');

  if (!branch) {
    url.pathname = `${user}/${project}`;
  } else {
    const service = getSupportedGitService(location);
    switch (service) {
      case 'github':
        url.pathname = `${user}/${project}/tree/${branch}`;
        break;
      case 'gitlab':
        url.pathname = `${user}/${project}/-/tree/${branch}`;
        break;
      case 'bitbucket':
        url.pathname = `${user}/${project}/src/${branch}`;
        break;
    }
  }

  return url.href;
}

export function getGitRepoOptionsFromLocation(location: string): {
  location: string | undefined;
  gitBranch: string | undefined;
  remotes: GitRemote[] | undefined;
  devfilePath: string | undefined;
  hasSupportedGitService: boolean;
} {
  const factory = new FactoryLocationAdapter(location);
  const factoryStr = factory.toString();
  const factoryLoaderPath = buildFactoryLoaderPath(factoryStr, true);
  const params = decodeURIComponent(factoryLoaderPath.split('?')[1] || '');
  const searchParams = new URLSearchParams(params);
  searchParams.delete('url');
  let devfilePath = searchParams.get('override.devfileFilename') || undefined;
  if (devfilePath === 'true') {
    searchParams.delete('override.devfileFilename');
    devfilePath = undefined;
  }
  let remotes: GitRemote[] | undefined;
  const _remotes = searchParams.get('remotes') || undefined;
  if (_remotes === 'true' || _remotes === '{}') {
    searchParams.delete('remotes');
    remotes = undefined;
  } else {
    remotes = getGitRemotes(_remotes);
  }
  const hasSupportedGitService = isSupportedGitService(location);
  const gitBranch = hasSupportedGitService ? getBranchFromLocation(location) : undefined;

  location =
    searchParams.toString().length === 0
      ? `${factory.path}`
      : `${factory.path}?${searchParams.toString()}`;

  return { location, gitBranch, remotes, devfilePath, hasSupportedGitService };
}

type GitRepoOptions = {
  location?: string;
  gitBranch?: string | undefined;
  remotes?: GitRemote[] | undefined;
  devfilePath?: string | undefined;
};

export function setGitRepoOptionsToLocation(
  newOptions: GitRepoOptions,
  currentOptions: GitRepoOptions,
): GitRepoOptions {
  const state: GitRepoOptions = {};
  let location = currentOptions.location;
  if (!location) {
    return newOptions;
  }
  const factory = new FactoryLocationAdapter(location);
  const factoryLoaderPath = buildFactoryLoaderPath(factory.toString(), true);
  const params = decodeURIComponent(factoryLoaderPath.split('?')[1]);
  const searchParams = new URLSearchParams(params);
  searchParams.delete('url');

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
  if (isSupportedGitService(location)) {
    location = setBranchToLocation(
      searchParams.toString().length > 0
        ? `${factory.path}?${searchParams.toString()}`
        : `${factory.path}`,
      newOptions.gitBranch,
    );
  } else {
    location =
      searchParams.toString().length > 0
        ? `${factory.path}?${searchParams.toString()}`
        : `${factory.path}`;
  }
  // update the location in the state
  state.location = location;

  return state;
}
