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

import { CoreV1Event } from '@kubernetes/client-node';

export const event1: CoreV1Event = {
  involvedObject: {
    kind: 'Pod',
    uid: 'pod-uid-1',
    name: 'pod-name-1',
    namespace: 'user-che',
  },
  metadata: {
    name: 'test-event-1',
    uid: 'test-event-1',
    resourceVersion: '1',
  },
  lastTimestamp: '2021-03-01T00:00:00Z' as unknown as Date,
  message: 'first test event message',
  source: {
    component: 'test-component',
  },
};

export const event2: CoreV1Event = {
  involvedObject: {
    kind: 'Pod',
    uid: 'pod-uid-2',
    name: 'pod-name-2',
    namespace: 'user-che',
  },
  metadata: {
    name: 'test-event-2',
    uid: 'test-event-2',
    resourceVersion: '2',
  },
  lastTimestamp: '2021-03-01T00:00:00Z' as unknown as Date,
  message: 'second test event message',
  source: {
    component: 'test-component',
  },
};
