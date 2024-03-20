/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import userEvent from '@testing-library/user-event';
import React from 'react';

import { GitServiceTooltip } from '@/pages/UserPreferences/GitServices/List/Tooltip';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('ProviderWarning', () => {
  beforeEach(() => {
    window.open = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot (isVisible = true)', () => {
    const snapshot = createSnapshot(true);

    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot (isVisible = false)', () => {
    const snapshot = createSnapshot(false);

    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('link button click', async () => {
    renderComponent(true);

    const link = screen.getByTestId('tooltip-link');
    userEvent.click(link);

    expect(window.open).toHaveBeenLastCalledWith('http://dummy.ref', '_blank');
  });
});

function getComponent(isVisible: boolean) {
  return <GitServiceTooltip serverURI={'http://dummy.ref'} isVisible={isVisible} />;
}
