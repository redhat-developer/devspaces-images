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

import { ValidatedOptions } from '@patternfly/react-core';
import * as React from 'react';

import getComponentRenderer, { fireEvent, screen } from '@/services/__mocks__/getComponentRenderer';

import { InputGroupExtended, Props } from '..';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnRemove = jest.fn();

describe('InputGroupExtended', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('snapshots', () => {
    test('readonly', () => {
      const snapshot = createSnapshot({
        isLoading: false,
        readonly: true,
        required: false,
        value: 'value',
        onRemove: mockOnRemove,
      });

      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('required', () => {
      const snapshot = createSnapshot({
        isLoading: false,
        readonly: false,
        required: true,
        value: 'value',
        onRemove: mockOnRemove,
      });

      expect(snapshot.toJSON()).toMatchSnapshot();
    });
  });

  it('should handle submiting', () => {
    renderComponent({
      isLoading: false,
      readonly: false,
      required: false,
      value: 'value',
      validated: ValidatedOptions.success,
      onRemove: mockOnRemove,
    });

    const input = screen.queryByTestId('text-input');
    fireEvent.submit(input!);
  });

  it('should handle removing the entry', () => {
    renderComponent({
      isLoading: false,
      readonly: false,
      required: false,
      value: 'value',
      validated: ValidatedOptions.success,
      onRemove: mockOnRemove,
    });

    const removeButton = screen.queryByTestId('button-remove');
    expect(removeButton).not.toBeNull();
    expect(removeButton).toBeEnabled();

    removeButton!.click();

    expect(mockOnRemove).toHaveBeenCalled();
  });

  it('should disable the remove button if required', () => {
    renderComponent({
      isLoading: false,
      readonly: false,
      required: true,
      value: 'value',
      validated: ValidatedOptions.default,
      onRemove: mockOnRemove,
    });

    const removeButton = screen.queryByTestId('button-remove');
    expect(removeButton).not.toBeNull();
    expect(removeButton).toBeDisabled();
  });

  it('should disable the remove button if in progress', () => {
    renderComponent({
      isLoading: true,
      readonly: false,
      required: false,
      value: 'value',
      validated: ValidatedOptions.default,
      onRemove: mockOnRemove,
    });

    const removeButton = screen.queryByTestId('button-remove');
    expect(removeButton).not.toBeNull();
    expect(removeButton).toBeDisabled();
  });
});

function getComponent(props: Props): React.ReactElement {
  return (
    <InputGroupExtended {...props}>
      <input data-testid="text-input" />
    </InputGroupExtended>
  );
}
