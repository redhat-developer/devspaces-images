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
import { TokenName } from '..';
import getComponentRenderer, {
  fireEvent,
  screen,
} from '../../../../../../../services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('TokenName', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot w/o token name', () => {
    const snapshot = createSnapshot(false);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot with token name', () => {
    const snapshot = createSnapshot(true, 'github-token');
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('read-only state', () => {
    renderComponent(true, 'github-token');

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  test('editable state', () => {
    renderComponent(false);

    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('readonly');
  });

  it('should handle a correct token name', async () => {
    renderComponent(false);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');

    const tokenName = 'github-token';
    fireEvent.change(input, { target: { value: tokenName } });

    expect(mockOnChange).toHaveBeenCalledWith(tokenName, true);
    expect(screen.queryByText('This field is required.')).toBeFalsy();
    expect(screen.queryByText(/^The Token Name is too long./)).toBeFalsy();
  });

  it('should handle a too long token name value', () => {
    renderComponent(false);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');

    // make it long enough to be invalid
    const tokenName = 'github-token'.repeat(100);
    fireEvent.change(input, { target: { value: tokenName } });

    expect(mockOnChange).toHaveBeenCalledWith(tokenName, false);

    expect(screen.queryByText('This field is required.')).toBeFalsy();
    expect(screen.queryByText(/^The Token Name is too long./)).toBeTruthy();
  });

  it('should handle the empty value', () => {
    renderComponent(false);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');

    // set a name
    const tokenName = 'github-token';
    fireEvent.change(input, { target: { value: tokenName } });

    mockOnChange.mockClear();

    // clear the name
    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith('', false);
    expect(screen.queryByText('This field is required.')).toBeTruthy();
    expect(screen.queryByText(/^The Token Name is too long./)).toBeFalsy();
  });

  it('should handle a non valid token name', () => {
    renderComponent(false);

    expect(mockOnChange).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox');

    // set non valid name
    const nonValidTokenName = 'github+token';
    fireEvent.change(input, { target: { value: nonValidTokenName } });

    expect(mockOnChange).toHaveBeenCalledWith(nonValidTokenName, false);
    expect(
      screen.queryByText(
        'The Token Name must consist of lower case alphanumeric characters, "-" or ".", and must start and end with an alphanumeric character.',
      ),
    ).toBeTruthy();
  });
});

function getComponent(isEdit: boolean, tokenName?: string): React.ReactElement {
  return (
    <Form>
      <TokenName isEdit={isEdit} tokenName={tokenName} onChange={mockOnChange} />
    </Form>
  );
}
