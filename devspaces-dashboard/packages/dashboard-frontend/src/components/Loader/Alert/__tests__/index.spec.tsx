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

import { AlertVariant } from '@patternfly/react-core';
import { render, RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LoaderAlert } from '..';
import { AlertItem } from '../../../../services/helpers/types';

const mockOnRestart = jest.fn();

describe('Loader Alert', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('no alert', () => {
    renderComponent();
    const alertGroup = screen.queryByRole('list', {
      name: 'Loader Alerts Group',
    });
    expect(alertGroup).toBeNull();
  });

  test('with alert item', () => {
    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Alert title',
      variant: AlertVariant.danger,
    };
    renderComponent(alertItem);

    const alertGroup = screen.queryByRole('list', {
      name: 'Loader Alerts Group',
    });
    expect(alertGroup).not.toBeNull();

    const alert = screen.queryByTestId('loader-alert');
    expect(alert).not.toBeNull();
  });

  it('should show alerts group', () => {
    const { rerender } = renderComponent();
    expect(screen.queryByTestId('loader-alerts-group')).toBeNull();

    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Alert title',
      variant: AlertVariant.danger,
    };
    rerender(getComponent(alertItem));

    expect(screen.queryByTestId('loader-alerts-group')).not.toBeNull();
  });

  it('should hide alerts group', () => {
    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Alert title',
      variant: AlertVariant.danger,
    };
    const { rerender } = renderComponent(alertItem);
    expect(screen.queryByTestId('loader-alerts-group')).not.toBeNull();

    rerender(getComponent());

    expect(screen.queryByTestId('loader-alerts-group')).toBeNull();
  });

  it('should handle the close alert action', () => {
    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Alert title',
      variant: AlertVariant.danger,
    };
    renderComponent(alertItem);

    const closeButton = screen.getByRole('button', {
      name: /^close/i,
    });
    userEvent.click(closeButton);

    const alertGroup = screen.queryByRole('list', {
      name: 'Loader Alerts Group',
    });
    expect(alertGroup).toBeNull();
  });

  it('should handle restart action', () => {
    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Alert title',
      variant: AlertVariant.danger,
    };
    renderComponent(alertItem);

    const closeButton = screen.getByRole('button', {
      name: 'Restart',
    });
    userEvent.click(closeButton);

    expect(mockOnRestart).toHaveBeenCalledWith(false);
  });

  it('should handle verbose restart action', () => {
    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Alert title',
      variant: AlertVariant.danger,
    };
    renderComponent(alertItem);

    const closeButton = screen.getByRole('button', {
      name: 'Open in Verbose mode',
    });
    userEvent.click(closeButton);

    expect(mockOnRestart).toHaveBeenCalledWith(true);
  });
});

function getComponent(alertItem?: AlertItem, isToast = true): React.ReactElement {
  return <LoaderAlert isToast={isToast} alertItem={alertItem} onRestart={mockOnRestart} />;
}

function renderComponent(...args: Parameters<typeof getComponent>): RenderResult {
  return render(getComponent(...args));
}
