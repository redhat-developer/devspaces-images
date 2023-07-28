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

export const token1: api.PersonalAccessToken = {
  cheUserId: 'che-user',
  gitProvider: 'github',
  gitProviderEndpoint: 'https://github.com',
  tokenData: 'token-data-1',
  tokenName: 'token-name-1',
};

export const token2: api.PersonalAccessToken = {
  cheUserId: 'che-user',
  gitProvider: 'github',
  gitProviderEndpoint: 'https://github.com',
  tokenData: 'token-data-2',
  tokenName: 'token-name-2',
};
