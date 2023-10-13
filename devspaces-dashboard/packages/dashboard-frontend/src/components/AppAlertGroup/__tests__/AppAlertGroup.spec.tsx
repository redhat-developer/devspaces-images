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

import { AlertVariant } from '@patternfly/react-core';
import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import React from 'react';

import { container } from '@/inversify.config';
import { AppAlerts } from '@/services/alerts/appAlerts';

import AppAlertGroup from '..';

const appAlerts = container.get(AppAlerts);

describe('AppAlertGroup component', () => {
  const showAlert = (title: string): void => {
    const key = 'wrks-delete';
    const variant = AlertVariant.success;
    appAlerts.showAlert({
      key,
      title,
      variant,
      timeout: 1000,
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should show the alert and hide with a close button', () => {
    renderComponent(<AppAlertGroup />);

    const title = 'test 1 message';
    showAlert(title);

    expect(screen.queryAllByText(title).length).toEqual(1);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(screen.queryAllByText(title).length).toEqual(0);
  });

  it('should show the alert and hide after timeout', () => {
    renderComponent(<AppAlertGroup />);

    const title = 'test 2 message';
    showAlert(title);

    expect(screen.queryAllByText(title).length).toEqual(1);

    // Fast-forward until pending timers have been executed
    jest.runAllTimers();

    expect(screen.queryAllByText(title).length).toEqual(0);
  });
});

function renderComponent(component: React.ReactElement): RenderResult {
  return render(component);
}
