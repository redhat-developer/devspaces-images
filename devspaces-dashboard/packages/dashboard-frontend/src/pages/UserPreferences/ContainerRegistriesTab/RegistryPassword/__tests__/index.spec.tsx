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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import renderer from 'react-test-renderer';

import { RegistryPasswordFormGroup } from '..';

describe('Registry Password Input', () => {
  const mockOnChange = jest.fn();

  function getComponent(password: string): React.ReactElement {
    return (
      <Form>
        <RegistryPasswordFormGroup password={password} onChange={mockOnChange} />
      </Form>
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render the component', () => {
    const component = getComponent('*ttt#');
    render(component);

    const input = screen.queryByTestId('registry-password-input');
    expect(input).toBeTruthy();

    const json = renderer.create(component).toJSON();

    expect(json).toMatchSnapshot();
  });

  it('should show default placeholder', () => {
    const component = getComponent('');
    render(component);

    const placeholder = screen.queryByPlaceholderText('Enter a password');
    expect(placeholder).toBeTruthy();
  });

  it('should correctly re-render the component', () => {
    const component = getComponent('*test');
    const { rerender } = render(component);

    const input = screen.getByTestId('registry-password-input');
    expect(input).toHaveValue('*test');

    rerender(
      <Form>
        <RegistryPasswordFormGroup password={'*testreg#'} onChange={mockOnChange} />
      </Form>,
    );

    expect(input).toHaveValue('*testreg#');
  });

  it('should fire onChange event', () => {
    const component = getComponent('*te');
    render(component);

    const input = screen.getByTestId('registry-password-input');

    expect(input).toHaveValue('*te');
    expect(mockOnChange).not.toHaveBeenCalled();

    userEvent.type(input, 'st');

    expect(mockOnChange).toHaveBeenCalledWith('*tes', 'success');
    expect(mockOnChange).toHaveBeenCalledWith('*test', 'success');
  });

  describe('validation', () => {
    it('should handle empty value', () => {
      const component = getComponent('https://testreg.com/test1');
      render(component);

      const input = screen.getByTestId('registry-password-input');

      userEvent.clear(input);

      const label = screen.queryByText('A value is required.');

      expect(label).toBeTruthy();
      expect(input).toBeInvalid();
    });

    it('should handle maximum value length', () => {
      const component = getComponent('https://testreg.com/test1');
      render(component);

      const input = screen.getByTestId('registry-password-input');

      const message = 'The password is too long. The maximum length is 10000 characters.';
      const allowedPassword = 'a'.repeat(10000);
      let label: HTMLElement | null;

      userEvent.clear(input);
      userEvent.type(input, allowedPassword);

      label = screen.queryByText(message);
      expect(label).toBeFalsy();

      const disallowedPassword = 'a'.repeat(10001);

      userEvent.clear(input);
      userEvent.type(input, disallowedPassword);

      label = screen.queryByText(message);
      expect(label).toBeTruthy();
      expect(input).toBeInvalid();
    });
  });
});
