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

// currently, it works on minikube only (decode from Base64 format)
export function getUserName(token: string): string {
  const tokenPayload = token.split('.')[1];
  const decodedTokenPayload = Buffer.from(tokenPayload, 'base64').toString();
  try {
    const parsedTokenPayload = JSON.parse(decodedTokenPayload);
    return parsedTokenPayload.name;
  } catch (e) {
    console.warn(`[WARN] Can't parse the token payload.`);
    throw e;
  }
}
