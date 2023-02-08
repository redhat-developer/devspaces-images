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

import { V1Pod } from '@kubernetes/client-node';

export const pod1: V1Pod = {
  kind: 'Pod',
  metadata: {
    name: 'pod1',
    namespace: 'user-che',
    uid: 'pod1-uid',
  },
};

export const pod2: V1Pod = {
  kind: 'Pod',
  metadata: {
    name: 'pod2',
    namespace: 'user-che',
    uid: 'pod2-uid',
  },
};
