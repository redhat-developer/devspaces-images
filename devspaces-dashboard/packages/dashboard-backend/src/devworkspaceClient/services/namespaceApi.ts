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

import * as k8s from '@kubernetes/client-node';
import { getUserName } from '../../helpers/getUserName';
import { INamespaceApi } from '../types';
import { createError } from './helpers/createError';
import { CoreV1API, prepareCoreV1API } from './helpers/prepareCoreV1API';

const NAMESPACE_API_ERROR_LABEL = 'CUSTOM_OBJECTS_API_ERROR';

export class NamespaceApiService implements INamespaceApi {
  private readonly coreV1API: CoreV1API;

  constructor(kc: k8s.KubeConfig) {
    this.coreV1API = prepareCoreV1API(kc);
  }

  async getNamespaces(token: string): Promise<Array<string>> {
    try {
      const name = getUserName(token);
      const resp = await this.coreV1API.listNamespace();
      const namespaces = resp.body.items
        .filter(item => {
          if (item.metadata?.labels?.['app.kubernetes.io/component'] !== 'workspaces-namespace') {
            return false;
          }
          return item.metadata?.annotations?.['che.eclipse.org/username'] === name;
        })
        .map(item => {
          return item.metadata?.labels?.['kubernetes.io/metadata.name'] || '';
        });
      return namespaces;
    } catch (e) {
      throw createError(e, NAMESPACE_API_ERROR_LABEL, 'Unable to get user namespaces');
    }
  }
}
