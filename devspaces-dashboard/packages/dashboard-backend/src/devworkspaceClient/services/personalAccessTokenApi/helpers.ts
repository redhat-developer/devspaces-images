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

import { api } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';

// base64 encoded `dummy-access-token-HqKrZVCZvSp7qPLF`
export const DUMMY_TOKEN_DATA = 'ZHVtbXktYWNjZXNzLXRva2VuLUhxS3JaVkNadlNwN3FQTEY=';

export const SECRET_LABELS = {
  'app.kubernetes.io/component': 'scm-personal-access-token',
  'app.kubernetes.io/part-of': 'che.eclipse.org',
} as PersonalAccessTokenSecret['metadata']['labels'];

export type TokenName = `personal-access-token-${string}`;
export type CheUserId = string;
export type GitProviderEndpoint = string;
export type GitProviderOrganization = string;
export interface PersonalAccessTokenSecret extends k8s.V1Secret {
  metadata: k8s.V1ObjectMeta & {
    name: TokenName;
    labels: {
      'app.kubernetes.io/component': 'scm-personal-access-token';
      'app.kubernetes.io/part-of': 'che.eclipse.org';
    };
    annotations: {
      'che.eclipse.org/che-userid': CheUserId;
      'che.eclipse.org/scm-url': GitProviderEndpoint;
    } & (
      | {
          'che.eclipse.org/scm-personal-access-token-name': Exclude<
            api.GitProvider,
            'azure-devops'
          >;
        }
      | {
          'che.eclipse.org/scm-personal-access-token-name': Extract<
            api.GitProvider,
            'azure-devops'
          >;
          'che.eclipse.org/scm-organization': GitProviderOrganization;
        }
    );
  };
  data: {
    token: string;
  };
}

export function buildLabelSelector(): string {
  return Object.entries(SECRET_LABELS)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}

export function toSecretName(tokenName: string): TokenName {
  return `personal-access-token-${tokenName}`;
}

export function isPatSecret(secret: k8s.V1Secret): secret is PersonalAccessTokenSecret {
  const hasLabels =
    secret.metadata?.labels !== undefined &&
    secret.metadata.labels['app.kubernetes.io/component'] === 'scm-personal-access-token' &&
    secret.metadata.labels['app.kubernetes.io/part-of'] === 'che.eclipse.org';

  return hasLabels;
}

export function toToken(secret: k8s.V1Secret): api.PersonalAccessToken {
  if (!isPatSecret(secret)) {
    throw new Error('Secret is not a personal access token');
  }

  return {
    tokenName: secret.metadata.name.replace('personal-access-token-', ''),
    cheUserId: secret.metadata.annotations['che.eclipse.org/che-userid'],
    gitProvider: secret.metadata.annotations['che.eclipse.org/scm-personal-access-token-name'],
    gitProviderEndpoint: secret.metadata.annotations['che.eclipse.org/scm-url'],
    gitProviderOrganization: secret.metadata.annotations['che.eclipse.org/scm-organization'],
    tokenData: DUMMY_TOKEN_DATA,
  };
}

export function toSecret(
  namespace: string,
  token: api.PersonalAccessToken,
): PersonalAccessTokenSecret {
  if (token.tokenData === DUMMY_TOKEN_DATA) {
    throw new Error('Personal access token is not defined');
  }

  let annotations: PersonalAccessTokenSecret['metadata']['annotations'];
  if (token.gitProvider === 'azure-devops') {
    annotations = {
      'che.eclipse.org/che-userid': token.cheUserId,
      'che.eclipse.org/scm-personal-access-token-name': token.gitProvider,
      'che.eclipse.org/scm-url': token.gitProviderEndpoint,
      'che.eclipse.org/scm-organization': token.gitProviderOrganization,
    };
  } else {
    annotations = {
      'che.eclipse.org/che-userid': token.cheUserId,
      'che.eclipse.org/scm-personal-access-token-name': token.gitProvider,
      'che.eclipse.org/scm-url': token.gitProviderEndpoint,
    };
  }

  return {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: toSecretName(token.tokenName),
      namespace,
      labels: SECRET_LABELS,
      annotations,
    },
    data: {
      token: token.tokenData,
    },
  };
}
