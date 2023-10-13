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

import * as devfileApi from '@/services/devfileApi/devfileApi';

export * from './typeguards';
export default devfileApi;

export interface IDevWorkspacesList {
  apiVersion: string;
  kind: string;
  items: devfileApi.DevWorkspace[];
  metadata: {
    resourceVersion: string;
    [key: string]: string;
  };
}
