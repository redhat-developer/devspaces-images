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

import { Form } from '@patternfly/react-core';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { GitProviderUsername } from '..';
import getComponentRenderer, {
  screen,
} from '../../../../../../../services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('GitProviderUsername', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot w/o username', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot with username', () => {
    const snapshot = createSnapshot('username');
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should handle a correct username', () => {
    const username = 'username';
    renderComponent();

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');
    userEvent.paste(input, username);

    expect(mockOnChange).toHaveBeenCalledWith(username, true);
    expect(screen.queryByText('This field is required.')).toBeFalsy();
    expect(screen.queryByText(/^The Provider Username is too long./)).toBeFalsy();
  });

  it('should handle a too long username value', () => {
    // make it long enough to be invalid
    const username = 'username'.repeat(50);
    renderComponent();

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');
    userEvent.paste(input, username);

    expect(mockOnChange).toHaveBeenCalledWith(username, false);
    expect(screen.queryByText('This field is required.')).toBeFalsy();
    expect(screen.queryByText(/^The Provider Username is too long./)).toBeTruthy();
  });

  it('should handle an empty value', () => {
    const username = 'username';
    renderComponent(username);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');
    userEvent.clear(input);

    expect(mockOnChange).toHaveBeenCalledWith('', false);
    expect(screen.queryByText('This field is required.')).toBeTruthy();
    expect(screen.queryByText(/^The Provider Username is too long./)).toBeFalsy();
  });
});

function getComponent(providerUsername?: string): React.ReactElement {
  return (
    <Form>
      <GitProviderUsername providerUsername={providerUsername} onChange={mockOnChange} />
    </Form>
  );
}
