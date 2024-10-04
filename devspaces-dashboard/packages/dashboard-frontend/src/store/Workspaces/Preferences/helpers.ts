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

export const gitProviderPatterns = {
  github: {
    https: /^https:\/\/github\.com\/([^\\/]+\/[^\\/]+)(?:\/.*)?$/,
    ssh: /^(?:(?:git\+)?ssh:\/\/)?git@github\.com:([^\\/]+\/[^\\/]+?)(?:\.git)?$/,
  },
  gitlab: {
    https: /^https:\/\/gitlab\.com\/([^\\/]+\/[^\\/]+)(?:\/.*)?$/,
    ssh: /^(?:(?:git\+)?ssh:\/\/)?git@gitlab\.com:([^\\/]+\/[^\\/]+?)(?:\.git)?$/,
  },
  bitbucket: {
    https: /^https:\/\/bitbucket\.org\/([^\\/]+\/[^\\/]+)(?:\/.*)?$/,
    ssh: /^(?:(?:git\+)?ssh:\/\/)?git@bitbucket\.org:([^\\/]+\/[^\\/]+?)(?:\.git)?$/,
  },
  azureDevOps: {
    // https: /^https:\/\/dev\.azure\.com\/([^\\/]+\/[^\\/]+\/_git\/[^\\/]+)(?:\/.*)?$/,
    // ssh: /^(?:(?:git\+)?ssh:\/\/)?git@ssh\.dev\.azure\.com:v3\/([^\\/]+\/[^\\/]+\/[^\\/]+)(?:\.git)?$/,
    https: /^https:\/\/(?:\w+@)?dev\.azure\.com\/([^\\/]+\/[^\\/]+\/_git\/[^\\/]+?)(?:\?.*)?$/,
    ssh: /^(?:ssh:\/\/)?git@ssh\.dev\.azure\.com:v3\/([^\\/]+\/[^\\/]+\/[^\\/]+)(?:\/[^\\/]+)?$/,
  },
};

/**
 * Checks if an URL is a GitHub repository.
 */
export function isGitHubRepo(url: string): boolean {
  const githubPatterns = gitProviderPatterns.github;
  return githubPatterns.https.test(url) || githubPatterns.ssh.test(url);
}

/**
 * Checks if an URL is a GitLab repository.
 */
export function isGitLabRepo(url: string): boolean {
  const gitlabPatterns = gitProviderPatterns.gitlab;
  return gitlabPatterns.https.test(url) || gitlabPatterns.ssh.test(url);
}

/**
 * Checks if an URL is a Bitbucket repository.
 */
export function isBitbucketRepo(url: string): boolean {
  const bitbucketPatterns = gitProviderPatterns.bitbucket;
  return bitbucketPatterns.https.test(url) || bitbucketPatterns.ssh.test(url);
}

/**
 * Checks if an URL is an Azure DevOps repository.
 */
export function isAzureDevOpsRepo(url: string): boolean {
  const azureDevOpsPatterns = gitProviderPatterns.azureDevOps;
  return azureDevOpsPatterns.https.test(url) || azureDevOpsPatterns.ssh.test(url);
}

/**
 * Extracts the repository name from a URL using a regular expression pattern.
 */
export function extractRepo(url: string, pattern: RegExp | undefined): string | null {
  if (pattern === undefined) {
    return null;
  }

  const match = url.match(pattern);
  if (!match) {
    return null;
  }

  return isAzureDevOpsRepo(url) ? match[1].replace('/_git', '') : match[1];
}

function getRepoPattern(url: string): RegExp | undefined {
  url = url.replace(/^(?:(?:git\+)?ssh:\/\/)/, '');
  if (url.startsWith('https://github.com/')) {
    return gitProviderPatterns.github.https;
  } else if (url.startsWith('https://gitlab.com/')) {
    return gitProviderPatterns.gitlab.https;
  } else if (url.startsWith('https://bitbucket.org/')) {
    return gitProviderPatterns.bitbucket.https;
  } else if (url.startsWith('https://dev.azure.com/')) {
    return gitProviderPatterns.azureDevOps.https;
  } else if (url.startsWith('git@github.com:')) {
    return gitProviderPatterns.github.ssh;
  } else if (url.startsWith('git@gitlab.com:')) {
    return gitProviderPatterns.gitlab.ssh;
  } else if (url.startsWith('git@bitbucket.org:')) {
    return gitProviderPatterns.bitbucket.ssh;
  } else if (url.startsWith('git@ssh.dev.azure.com:')) {
    return gitProviderPatterns.azureDevOps.ssh;
  }
}

export function isTrustedRepo(
  trustedSources: api.TrustedSources | undefined,
  url: string | URL,
): boolean {
  if (trustedSources === undefined) {
    return false;
  }
  if (trustedSources === '*') {
    return true;
  }

  const urlString = url.toString();
  const urlPattern = getRepoPattern(urlString);
  const urlRepo = extractRepo(urlString, urlPattern);

  // Check if the URL matches any of the trusted repositories
  return trustedSources.some(trustedUrl => {
    const trustedUrlPattern = getRepoPattern(trustedUrl);
    const trustedUrlRepo = extractRepo(trustedUrl, trustedUrlPattern);

    if (urlRepo !== null && trustedUrlRepo !== null) {
      // compare repository names
      return urlRepo === trustedUrlRepo;
    } else {
      // compare URLs as is
      return urlString === trustedUrl;
    }
  });
}
