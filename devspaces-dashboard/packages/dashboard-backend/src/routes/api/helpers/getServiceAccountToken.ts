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

import { existsSync, readFileSync } from 'fs';
import { isLocalRun } from '../../../localRun';

export const SERVICE_ACCOUNT_TOKEN_PATH = '/run/secrets/kubernetes.io/serviceaccount/token';

export function getServiceAccountToken(): string {
  if (isLocalRun()) {
    return process.env.SERVICE_ACCOUNT_TOKEN as string;
  }
  if (!existsSync(SERVICE_ACCOUNT_TOKEN_PATH)) {
    console.error('SERVICE_ACCOUNT_TOKEN is required');
    process.exit(1);
  }
  return readFileSync(SERVICE_ACCOUNT_TOKEN_PATH).toString();
}
