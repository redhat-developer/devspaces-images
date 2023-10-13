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

import { IGitOauth } from '@/store/GitOauthConfig/types';

export class FakeGitOauthBuilder {
  private gitOauth: IGitOauth = { name: 'github', endpointUrl: '-' };

  public withName(name: api.GitOauthProvider): FakeGitOauthBuilder {
    this.gitOauth.name = name;
    return this;
  }

  public withEndpointUrl(endpointUrl: string): FakeGitOauthBuilder {
    this.gitOauth.endpointUrl = endpointUrl;
    return this;
  }

  public build(): IGitOauth {
    return this.gitOauth;
  }
}
