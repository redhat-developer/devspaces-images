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
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { RegistryUsernameFormGroup } from '..';

describe('Registry Username Input', () => {
  const mockOnChange = jest.fn();

  function getComponent(username: string): React.ReactElement {
    return (
      <Form>
        <RegistryUsernameFormGroup username={username} onChange={mockOnChange} />
      </Form>
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render the component', () => {
    const component = getComponent('Attt');
    render(component);

    const input = screen.queryByRole('textbox');
    expect(input).toBeTruthy();

    const json = renderer.create(component).toJSON();

    expect(json).toMatchSnapshot();
  });

  it('should show default placeholder', () => {
    render(getComponent(''));

    const placeholder = screen.queryByPlaceholderText('Enter a username');
    expect(placeholder).toBeTruthy();
  });

  it('should correctly re-render the component', () => {
    const component = getComponent('Atest');
    const { rerender } = render(component);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Atest');

    rerender(getComponent('Atestregn'));

    expect(input).toHaveValue('Atestregn');
  });

  it('should fire onChange event', () => {
    const component = getComponent('Ate');
    render(component);

    const input = screen.getByRole('textbox');

    userEvent.type(input, 'st');

    expect(mockOnChange).toHaveBeenCalledWith('Ates', 'success');
    expect(mockOnChange).toHaveBeenCalledWith('Atest', 'success');
  });

  describe('validation', () => {
    it('should handle maximum value length', () => {
      const component = getComponent('https://testreg.com/test1');
      render(component);

      const input = screen.getByRole('textbox');

      const message = 'The username is too long. The maximum length is 100 characters.';
      const allowedUsername = 'a'.repeat(100);
      let label: HTMLElement | null;

      userEvent.clear(input);
      userEvent.type(input, allowedUsername);

      label = screen.queryByText(message);
      expect(label).toBeFalsy();

      const disallowedUsername = 'a'.repeat(101);

      userEvent.clear(input);
      userEvent.type(input, disallowedUsername);

      label = screen.queryByText(message);
      expect(label).toBeTruthy();
      expect(input).toBeInvalid();
    });
  });
});
