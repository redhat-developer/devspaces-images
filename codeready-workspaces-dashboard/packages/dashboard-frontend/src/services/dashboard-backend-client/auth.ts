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

import { KeycloakAuthService } from '../keycloak/auth';

export function addAuthentication(headers: { [key: string]: string }) {
  const token = KeycloakAuthService?.keycloak?.token;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`; // Bearer Token Authentication
  }
  return headers;
}
