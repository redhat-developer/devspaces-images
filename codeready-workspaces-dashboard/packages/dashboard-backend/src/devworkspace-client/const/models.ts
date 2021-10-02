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

import { projectApiGroup } from './index';

export const projectRequestModel = (namespace: string) => {
  return {
    apiVersion: `${projectApiGroup}/v1`,
    kind: 'ProjectRequest',
    metadata: {
      name: namespace,
    },
  };
};

export const namespaceModel = (namespace: string) => {
  return {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: {
      name: namespace,
    },
  };
};

export enum deletePolicy {
  Background = 'Background',
  Foreground = 'Foreground'
}

export const deletionOptions = (policy: deletePolicy) => {
  return {
    apiVersion: 'v1',
    kind: 'DeleteOptions',
    propagationPolicy: policy
  };
};
