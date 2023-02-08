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

import React from 'react';
import { Props } from '..';

export class WorkspaceEventsItem extends React.PureComponent<Props> {
  render(): React.ReactElement {
    const { event } = this.props;
    return (
      <div data-testid="event-item">
        <span data-testid="event-message">{event.message}</span>
        <span data-testid="event-time">{event.lastTimestamp}</span>
        <span data-testid="event-source">
          {event.source?.component} on {event.source?.host}
        </span>
        <span data-testid="event-involved-object">
          {event.involvedObject.kind} {event.involvedObject.name}
        </span>
      </div>
    );
  }
}
