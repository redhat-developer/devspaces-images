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

export type FactoryParams = {
  factoryId: string;
  factoryUrl: string;
  policiesCreate: PoliciesCreate;
  sourceUrl: string;
  useDevworkspaceResources: boolean;
  overrides: Record<string, string> | undefined;
  errorCode: ErrorCode | undefined;
  storageType: che.WorkspaceStorageType | undefined;
  cheEditor: string | undefined;
  remotes: string | undefined;
};

export type PoliciesCreate = 'perclick' | 'peruser';

export type ErrorCode = 'invalid_request' | 'access_denied';
