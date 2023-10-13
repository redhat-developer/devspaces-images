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
import React from 'react';

import getComponentRenderer, { fireEvent, screen } from '@/services/__mocks__/getComponentRenderer';

import { TokenData } from '..';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('TokenData', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot w/o token data', () => {
    const snapshot = createSnapshot(false);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot with token data', () => {
    const snapshot = createSnapshot(true, 'token-data');
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('edit token mode', () => {
    renderComponent(true, 'token-data');

    screen.queryByPlaceholderText('Replace Token');
  });

  test('add token mode', () => {
    renderComponent(false);

    screen.queryByPlaceholderText('Enter a Token');
  });

  it('should handle token data', () => {
    renderComponent(false);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');

    const tokenData = 'token-data';
    fireEvent.change(input, { target: { value: tokenData } });

    expect(mockOnChange).toHaveBeenCalledWith(btoa(tokenData), true);
    expect(screen.queryByText('This field is required.')).toBeFalsy();
  });

  it('should handle the empty value', () => {
    renderComponent(false);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');

    // fill the token data field
    const tokenData = 'token-data';
    fireEvent.change(input, { target: { value: tokenData } });

    mockOnChange.mockClear();

    // clear the token data field
    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith('', false);
    expect(screen.queryByText('This field is required.')).toBeTruthy();
  });
});

function getComponent(isEdit: boolean, tokenData?: string): React.ReactElement {
  return (
    <Form>
      <TokenData isEdit={isEdit} tokenData={tokenData} onChange={mockOnChange} />
    </Form>
  );
}
