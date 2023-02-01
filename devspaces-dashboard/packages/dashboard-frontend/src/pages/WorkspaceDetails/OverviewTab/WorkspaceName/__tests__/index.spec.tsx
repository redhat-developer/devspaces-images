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
import { RenderResult, render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceNameFormGroup } from '..';

describe('Overview Tab Workspace Name Input', () => {
  const mockOnSave = jest.fn();

  function renderInput(name: string): RenderResult {
    return render(<WorkspaceNameFormGroup name={name} readonly={false} onSave={mockOnSave} />);
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show default placeholder', () => {
    renderInput('new-workspace');

    screen.getByTestId('overview-name-edit-toggle').click();

    const placeholder = screen.getByPlaceholderText('Enter a workspace name');
    expect(placeholder).toBeTruthy();
  });

  it('should show placeholder with generated name', () => {
    renderInput('');

    screen.getByTestId('overview-name-edit-toggle').click();

    const textbox = screen.getByRole('textbox');
    expect(textbox).toBeTruthy();

    const placeholder = textbox.getAttribute('placeholder');
    expect(placeholder).toMatch('Enter a workspace name');
  });

  it('should correctly render the component', () => {
    renderInput('new-workspace');

    screen.getByTestId('overview-name-edit-toggle').click();

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('new-workspace');
  });

  it('should make form readonly', () => {
    render(<WorkspaceNameFormGroup name="wksp-name" readonly={true} onSave={mockOnSave} />);

    expect(screen.queryByTestId('overview-name-edit-toggle')).not.toBeInTheDocument();
  });

  it('should correctly re-render the component', () => {
    const { rerender } = renderInput('name');

    screen.getByTestId('overview-name-edit-toggle').click();

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('name');

    rerender(<WorkspaceNameFormGroup name={'new-name'} readonly={false} onSave={mockOnSave} />);

    expect(input).toHaveValue('new-name');
  });

  it('should fire onChange event', () => {
    renderInput('');

    screen.getByTestId('overview-name-edit-toggle').click();

    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'new-workspace' } });

    screen.getByTestId('handle-on-save').click();

    expect(mockOnSave).toHaveBeenCalledWith('new-workspace');
  });

  describe('Overview Tab Workspace Name Validation', () => {
    let textbox: HTMLInputElement;

    beforeEach(() => {
      renderInput('new-workspace');

      screen.getByTestId('overview-name-edit-toggle').click();

      textbox = screen.getByRole('textbox') as HTMLInputElement;
    });

    it('should handle empty value', () => {
      fireEvent.change(textbox, { target: { value: '' } });
      const label = screen.getByText('A value is required.');
      expect(label).toBeTruthy();
      expect(textbox).toBeInvalid();
    });

    it('should handle minimal value length', () => {
      let label: HTMLElement | null;
      const message = 'The name has to be at least 3 characters long.';

      const disallowedName1 = 'a';

      fireEvent.change(textbox, { target: { value: disallowedName1 } });
      label = screen.queryByText(message);
      expect(label).toBeTruthy();
      expect(textbox).toBeInvalid();

      const disallowedName2 = 'ab';

      fireEvent.change(textbox, { target: { value: disallowedName2 } });
      label = screen.queryByText(message);
      expect(label).toBeTruthy();
      expect(textbox).toBeInvalid();

      const allowedName = 'abc';

      fireEvent.change(textbox, { target: { value: allowedName } });
      label = screen.queryByText(message);
      expect(label).not.toBeTruthy();
      expect(textbox).toBeValid();
    });

    it('should handle maximum value length', () => {
      let label: HTMLElement | null;
      const message = 'The name is too long. The maximum length is 100 characters.';

      const allowedName = 'a'.repeat(100);

      fireEvent.change(textbox, { target: { value: allowedName } });
      label = screen.queryByText(message);
      expect(label).toBeFalsy();
      expect(textbox).toBeValid();

      const disallowedName = 'a'.repeat(101);

      fireEvent.change(textbox, { target: { value: disallowedName } });
      label = screen.queryByText(message);
      expect(label).toBeTruthy();
      expect(textbox).toBeInvalid();
    });

    it('should handle pattern mismatch', () => {
      let label: HTMLElement | null;
      const message =
        'The name can contain digits, latin letters, underscores and it should not contain special characters like space, dollar, etc. It should start and end only with digit or latin letter.';

      const allowedName = 'new-name';

      fireEvent.change(textbox, { target: { value: allowedName } });
      label = screen.queryByText(message);
      expect(label).toBeFalsy();
      expect(textbox).toBeValid();

      const disallowedName1 = 'new*name';

      fireEvent.change(textbox, { target: { value: disallowedName1 } });
      label = screen.queryByText(message);
      expect(label).toBeTruthy();
      expect(textbox).toBeInvalid();

      const disallowedName2 = '-new-name';

      fireEvent.change(textbox, { target: { value: disallowedName2 } });
      label = screen.queryByText(message);
      expect(label).toBeTruthy();
      expect(textbox).toBeInvalid();

      const disallowedName3 = 'new-name-';

      fireEvent.change(textbox, { target: { value: disallowedName3 } });
      label = screen.queryByText(message);
      expect(label).toBeTruthy();
      expect(textbox).toBeInvalid();
    });
  });
});
