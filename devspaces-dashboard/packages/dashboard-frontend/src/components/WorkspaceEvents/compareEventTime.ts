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

/**
 * Compares two events by lastTimestamp.
 */
export default function compareEventTime(eventA: CoreV1Event, eventB: CoreV1Event): number {
  const timestampA = eventA.lastTimestamp || eventA.eventTime;
  const timestampB = eventB.lastTimestamp || eventB.eventTime;
  if (timestampA === undefined || timestampB === undefined) {
    return 0;
  }
  const aTime = new Date(timestampA as unknown as string).getTime();
  const bTime = new Date(timestampB as unknown as string).getTime();
  return bTime - aTime;
}
