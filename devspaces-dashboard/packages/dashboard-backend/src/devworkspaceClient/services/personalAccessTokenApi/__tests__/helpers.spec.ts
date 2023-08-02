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
import k8s from '@kubernetes/client-node';
import {
  buildLabelSelector,
  DUMMY_TOKEN_DATA,
  isPatSecret,
  PersonalAccessTokenSecret,
  toSecret,
  toSecretName,
  toToken,
} from '../helpers';

describe('Helpers for Personal Access Token API', () => {
  test('buildLabelSelector', () => {
    expect(buildLabelSelector()).toEqual(
      'app.kubernetes.io/component=scm-personal-access-token,app.kubernetes.io/part-of=che.eclipse.org',
    );
  });

  test('toSecretName', () => {
    const tokenName = 'asdf-1234';
    expect(toSecretName(tokenName)).toEqual('personal-access-token-asdf-1234');
  });

  describe('isPatSecret', () => {
    let secret: PersonalAccessTokenSecret;

    beforeEach(() => {
      secret = {
        metadata: {
          labels: {
            'app.kubernetes.io/component': 'scm-personal-access-token',
            'app.kubernetes.io/part-of': 'che.eclipse.org',
          },
          annotations: {
            'che.eclipse.org/che-userid': 'che-user',
            'che.eclipse.org/scm-url': 'https://github.com',
            'che.eclipse.org/scm-personal-access-token-name': 'github',
          },
          name: 'personal-access-token-asdf-1234',
        },
        data: {
          token: 'ZHVtbXktYWNjZXNzLXRva2VuLUhxS3JaVkNadlNwN3FQTEY=',
        },
      };
    });

    test('the correct secret', () => {
      expect(isPatSecret(secret)).toBeTruthy();
    });

    test('secret with incorrect label "app.kubernetes.io/component"', () => {
      delete (secret.metadata as k8s.V1ObjectMeta).labels?.['app.kubernetes.io/component'];
      expect(isPatSecret(secret)).toBeFalsy();
    });

    test('secret with incorrect label "app.kubernetes.io/part-of"', () => {
      delete (secret.metadata as k8s.V1ObjectMeta).labels?.['app.kubernetes.io/part-of'];
      expect(isPatSecret(secret)).toBeFalsy();
    });
  });

  describe('toToken', () => {
    test('personal access token secret', () => {
      const secret: PersonalAccessTokenSecret = {
        metadata: {
          labels: {
            'app.kubernetes.io/component': 'scm-personal-access-token',
            'app.kubernetes.io/part-of': 'che.eclipse.org',
          },
          annotations: {
            'che.eclipse.org/che-userid': 'che-user',
            'che.eclipse.org/scm-url': 'https://github.com',
            'che.eclipse.org/scm-personal-access-token-name': 'github',
          },
          name: 'personal-access-token-asdf-1234',
        },
        data: {
          token: DUMMY_TOKEN_DATA,
        },
      };

      const token = toToken(secret);

      expect(token).toStrictEqual({
        tokenName: 'asdf-1234',
        cheUserId: 'che-user',
        gitProvider: 'github',
        gitProviderEndpoint: 'https://github.com',
        gitProviderOrganization: undefined,
        tokenData: DUMMY_TOKEN_DATA,
      });
    });

    test('not personal access token secret', () => {
      const secret: k8s.V1Secret = {
        kind: 'Secret',
        metadata: {
          name: 'some-secret',
        },
      };

      expect(() => toToken(secret)).toThrowError();
    });
  });

  describe('toSecret', () => {
    test('token with correct data', () => {
      const namespace = 'user-che';
      const token: api.PersonalAccessToken = {
        tokenName: 'asdf-1234',
        cheUserId: 'che-user',
        gitProvider: 'github',
        gitProviderEndpoint: 'https://github.com',
        tokenData: 'base64-encoded-token-data',
      };

      const secret = toSecret(namespace, token);
      expect(secret).toStrictEqual({
        apiVersion: 'v1',
        data: {
          token: 'base64-encoded-token-data',
        },
        kind: 'Secret',
        metadata: {
          annotations: {
            'che.eclipse.org/che-userid': 'che-user',
            'che.eclipse.org/scm-personal-access-token-name': 'github',
            'che.eclipse.org/scm-url': 'https://github.com',
          },
          labels: {
            'app.kubernetes.io/component': 'scm-personal-access-token',
            'app.kubernetes.io/part-of': 'che.eclipse.org',
          },
          name: 'personal-access-token-asdf-1234',
          namespace: 'user-che',
        },
      });
    });

    test('token with correct data - azure-devops', () => {
      const namespace = 'user-che';
      const token: api.PersonalAccessToken = {
        tokenName: 'asdf-1234',
        cheUserId: 'che-user',
        gitProvider: 'azure-devops',
        gitProviderEndpoint: 'https://dev.azure.com',
        gitProviderOrganization: 'azure-org',
        tokenData: 'base64-encoded-token-data',
      };

      const secret = toSecret(namespace, token);
      expect(secret).toStrictEqual({
        apiVersion: 'v1',
        data: {
          token: 'base64-encoded-token-data',
        },
        kind: 'Secret',
        metadata: {
          annotations: {
            'che.eclipse.org/che-userid': token.cheUserId,
            'che.eclipse.org/scm-personal-access-token-name': token.gitProvider,
            'che.eclipse.org/scm-url': token.gitProviderEndpoint,
            'che.eclipse.org/scm-organization': token.gitProviderOrganization,
          },
          labels: {
            'app.kubernetes.io/component': 'scm-personal-access-token',
            'app.kubernetes.io/part-of': 'che.eclipse.org',
          },
          name: `personal-access-token-${token.tokenName}`,
          namespace,
        },
      });
    });

    test('token with dummy data', () => {
      const namespace = 'user-che';
      const token: api.PersonalAccessToken = {
        tokenName: 'asdf-1234',
        cheUserId: 'che-user',
        gitProvider: 'github',
        gitProviderEndpoint: 'https://github.com',
        tokenData: DUMMY_TOKEN_DATA,
      };

      expect(() => toSecret(namespace, token)).toThrowError();
    });
  });
});
