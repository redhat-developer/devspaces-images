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
import userEvent from '@testing-library/user-event';
import React from 'react';

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { AlertItem } from '@/services/helpers/types';

import { ProgressAlert } from '..';

const { renderComponent, createSnapshot } = getComponentRenderer(getComponent);

const mockOnClose = jest.fn();

const alertItem1: AlertItem = {
  key: 'alert-id-1',
  title: 'Alert title 1',
  variant: AlertVariant.danger,
  actionCallbacks: [
    {
      title: 'Close',
      callback: mockOnClose,
    },
  ],
};
const alertItem2: AlertItem = {
  key: 'alert-id-2',
  title: 'Alert title 2',
  variant: AlertVariant.warning,
};

describe('Loader Alert', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot with no alerts', () => {
    expect(createSnapshot([])).toMatchSnapshot();
  });

  test('snapshot with alert items', () => {
    expect(createSnapshot([alertItem1, alertItem2])).toMatchSnapshot();
  });

  it('should show alerts group', () => {
    const { reRenderComponent } = renderComponent([]);
    expect(screen.queryByTestId('loader-alerts-group')).toBeNull();

    reRenderComponent([alertItem1]);

    expect(screen.queryByTestId('loader-alerts-group')).not.toBeNull();
  });

  it('should hide alerts group', () => {
    const { reRenderComponent } = renderComponent([alertItem1]);
    expect(screen.queryByTestId('loader-alerts-group')).not.toBeNull();

    reRenderComponent([]);

    expect(screen.queryByTestId('loader-alerts-group')).toBeNull();
  });

  it('should handle the close alert action', () => {
    renderComponent([alertItem1, alertItem2]);

    const closeButton = screen.getByRole('button', {
      name: /close/i,
    });
    userEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

function getComponent(alertItems: AlertItem[]): React.ReactElement {
  return (
    <React.Fragment>
      <ProgressAlert isToast={false} alertItems={alertItems} />
    </React.Fragment>
  );
}
