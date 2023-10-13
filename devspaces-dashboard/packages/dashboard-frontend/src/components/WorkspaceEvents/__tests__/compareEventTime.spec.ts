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

import sortEvents from '@/components/WorkspaceEvents/compareEventTime';

describe('sortEvents', () => {
  let event1: CoreV1Event;
  let event2: CoreV1Event;
  let event3: CoreV1Event;

  beforeEach(() => {
    event1 = {
      involvedObject: {},
      lastTimestamp: '2021-05-19T11:10:00Z' as unknown as Date,
      metadata: {},
      message: 'Event message 1',
    };
    event2 = {
      involvedObject: {},
      metadata: {},
      message: 'Event message 2',
    };
    event3 = {
      involvedObject: {},
      lastTimestamp: '2021-05-19T11:30:00Z' as unknown as Date,
      metadata: {},
      message: 'Event message 3',
    };
  });

  it('should sort events by lastTimestamp', () => {
    expect(sortEvents(event1, event1)).toEqual(0);
    expect(sortEvents(event1, event3)).toBeGreaterThan(0);
    expect(sortEvents(event3, event1)).toBeLessThan(0);
  });

  it('should not sort events without lastTimestamp', () => {
    expect(sortEvents(event2, event2)).toEqual(0);
    expect(sortEvents(event1, event2)).toEqual(0);
    expect(sortEvents(event2, event1)).toEqual(0);
  });
});
