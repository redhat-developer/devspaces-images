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

import { ValidatedOptions } from '@patternfly/react-core';
import { StateMock } from '@react-mock/state';
import * as React from 'react';

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { InputGroupExtended, Props, State } from '..';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnCancel = jest.fn();
const mockOnSave = jest.fn();

describe('InputGroupExtended', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('snapshots', () => {
    test('readonly', () => {
      const snapshot = createSnapshot({
        readonly: true,
        value: 'value',
        onCancel: mockOnCancel,
        onSave: mockOnSave,
      });

      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('editable', () => {
      const snapshot = createSnapshot({
        readonly: false,
        value: 'value',
        onCancel: mockOnCancel,
        onSave: mockOnSave,
      });

      expect(snapshot.toJSON()).toMatchSnapshot();
    });
  });

  it('should switch in edit mode', () => {
    renderComponent({
      readonly: false,
      value: 'value',
      onCancel: mockOnCancel,
      onSave: mockOnSave,
    });

    const editButton = screen.queryByTestId('button-edit');
    expect(editButton).not.toBeNull();

    editButton!.click();

    expect(screen.queryByTestId('button-edit')).toBeNull();

    expect(screen.queryByTestId('text-input')).not.toBeNull();
    expect(screen.queryByTestId('button-save')).not.toBeNull();
    expect(screen.queryByTestId('button-cancel')).not.toBeNull();
  });

  it('should switch out of edit mode', () => {
    renderComponent(
      {
        readonly: false,
        value: 'value',
        onCancel: mockOnCancel,
        onSave: mockOnSave,
      },
      {
        isEditMode: true,
      },
    );

    const cancelButton = screen.queryByTestId('button-cancel');
    expect(cancelButton).not.toBeNull();
    expect(cancelButton).toBeEnabled();

    cancelButton!.click();

    expect(mockOnCancel).toBeCalled();
    expect(screen.queryByTestId('button-edit')).not.toBeNull();

    expect(screen.queryByTestId('text-input')).toBeNull();
    expect(screen.queryByTestId('button-save')).toBeNull();
    expect(screen.queryByTestId('button-cancel')).toBeNull();
  });

  it('should handle save', () => {
    renderComponent(
      {
        readonly: false,
        value: 'value',
        onCancel: mockOnCancel,
        onSave: mockOnSave,
        validated: ValidatedOptions.success,
      },
      {
        isEditMode: true,
      },
    );

    const saveButton = screen.queryByTestId('button-save');
    expect(saveButton).not.toBeNull();
    expect(saveButton).toBeEnabled();

    saveButton!.click();

    expect(mockOnSave).toBeCalled();
    expect(screen.queryByTestId('button-edit')).not.toBeNull();

    expect(screen.queryByTestId('text-input')).toBeNull();
    expect(screen.queryByTestId('button-save')).toBeNull();
    expect(screen.queryByTestId('button-cancel')).toBeNull();
  });

  it('should disable save button if not validated', () => {
    renderComponent(
      {
        readonly: false,
        value: 'value',
        onCancel: mockOnCancel,
        onSave: mockOnSave,
        validated: ValidatedOptions.error,
      },
      {
        isEditMode: true,
      },
    );

    const saveButton = screen.queryByTestId('button-save');
    expect(saveButton).not.toBeNull();
    expect(saveButton).toBeDisabled();
  });
});

function getComponent(props: Props, localState?: Partial<State>): React.ReactElement {
  const component = (
    <InputGroupExtended {...props}>
      <div data-testid="text-input" />
    </InputGroupExtended>
  );
  if (localState) {
    return <StateMock state={localState}>{component}</StateMock>;
  } else {
    return component;
  }
}
