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

import getComponentRenderer, { fireEvent, screen } from '@/services/__mocks__/getComponentRenderer';

import { PersonalAccessTokenEmptyState } from '..';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnAddToken = jest.fn();

describe('EmptyState', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot(false);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('add a new token', () => {
    renderComponent(false);

    expect(mockOnAddToken).not.toHaveBeenCalled();

    const button = screen.getByRole('button', { name: 'Add Personal Access Token' });

    expect(button).toBeEnabled();

    fireEvent.click(button);

    expect(mockOnAddToken).toHaveBeenCalled();
  });

  test('disable Add Token button', () => {
    renderComponent(true);

    expect(mockOnAddToken).not.toHaveBeenCalled();

    const button = screen.getByRole('button', { name: 'Add Personal Access Token' });

    expect(button).toBeDisabled();
  });
});

function getComponent(isDisabled: boolean): React.ReactElement {
  return <PersonalAccessTokenEmptyState isDisabled={isDisabled} onAddToken={mockOnAddToken} />;
}
