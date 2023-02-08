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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { CoreV1Event } from '@kubernetes/client-node';
import { screen } from '@testing-library/react';
import React from 'react';
import { WorkspaceEventsItem } from '..';
import getComponentRenderer from '../../../../services/__mocks__/getComponentRenderer';

jest.mock('date-fns', () => ({
  format: jest.fn(() => '14:00:00'),
}));

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const message = 'Event message';
const involvedObjectName = 'pod-name';
const time = '14:00:00';
const dateISO = '2023-01-05T12:00:00.000Z';
const component = 'component';
const host = '0.0.0.0';

describe('WorkspaceEventsItem component', () => {
  let event: CoreV1Event;

  beforeEach(() => {
    event = {
      involvedObject: {
        name: involvedObjectName,
        kind: 'Pod',
      },
      metadata: {
        name: 'event-name',
        namespace: 'user-che',
      },
      lastTimestamp: dateISO as unknown as Date,
      message,
      source: {
        component,
        host,
      },
    };

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('snapshot', () => {
    expect(createSnapshot(event).toJSON()).toMatchSnapshot();
  });

  it('should render event message', () => {
    renderComponent(event);
    expect(screen.queryByText(message)).toBeTruthy();
  });

  it('should render involved object name', () => {
    renderComponent(event);
    expect(screen.queryByTestId('event-involved-object')).toBeTruthy();
    expect(screen.queryByText(involvedObjectName)).toBeTruthy();
  });

  it('should not render involved object name if it is not defined', () => {
    delete event.involvedObject.kind;
    delete event.involvedObject.name;

    renderComponent(event);
    expect(screen.queryByTestId('event-involved-object')).toBeFalsy();
  });

  it('should render event time', () => {
    renderComponent(event);
    expect(screen.queryByTestId('event-time')).toBeTruthy();
    expect(screen.queryByText(time)).toBeTruthy();
  });

  it('should not render event time', () => {
    delete event.lastTimestamp;

    renderComponent(event);
    expect(screen.queryByTestId('event-time')).toBeFalsy();
  });

  it('should render event source: component and host', () => {
    renderComponent(event);
    const source = `Generated from ${component} on ${host}`;
    expect(screen.queryByText(source)).toBeTruthy();
  });

  it('should render event source: component', () => {
    delete event.source?.host;

    renderComponent(event);
    const source = `Generated from ${component}`;
    expect(screen.queryByText(source)).toBeTruthy();
  });

  it('should not render event source: no component', () => {
    delete event.source?.component;

    renderComponent(event);
    const source = `Generated from`;
    expect(screen.queryByText(source)).toBeFalsy();
  });

  it('should not render event source: no source', () => {
    delete event.source;

    renderComponent(event);
    const source = `Generated from`;
    expect(screen.queryByText(source)).toBeFalsy();
  });
});

function getComponent(event: CoreV1Event): React.ReactElement {
  return <WorkspaceEventsItem event={event} />;
}
