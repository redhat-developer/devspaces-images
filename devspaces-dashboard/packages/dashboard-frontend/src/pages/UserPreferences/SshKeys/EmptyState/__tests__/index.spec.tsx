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

import { SshKeysEmptyState } from '..';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnAddSshKey = jest.fn();

describe('EmptyState', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot(false);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('add a new SSH key', () => {
    renderComponent(false);

    expect(mockOnAddSshKey).not.toHaveBeenCalled();

    const button = screen.getByRole('button', { name: 'Add SSH Key' });

    expect(button).toBeEnabled();

    fireEvent.click(button);

    expect(mockOnAddSshKey).toHaveBeenCalled();
  });

  test('disable Add SSH Key button', () => {
    renderComponent(true);

    expect(mockOnAddSshKey).not.toHaveBeenCalled();

    const button = screen.getByRole('button', { name: 'Add SSH Key' });

    expect(button).toBeDisabled();
  });
});

function getComponent(isDisabled: boolean): React.ReactElement {
  return <SshKeysEmptyState isDisabled={isDisabled} onAddSshKey={mockOnAddSshKey} />;
}
