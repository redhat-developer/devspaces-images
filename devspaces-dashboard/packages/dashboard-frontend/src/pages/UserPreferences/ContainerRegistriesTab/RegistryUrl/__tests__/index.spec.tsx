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

import { RegistryUrlFormGroup } from '..';

describe('Registry Url Input', () => {
  const mockOnChange = jest.fn();

  function getComponent(url: string): React.ReactElement {
    return (
      <Form>
        <RegistryUrlFormGroup url={url} onChange={mockOnChange} />
      </Form>
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render the component', () => {
    const component = getComponent('https://ttt');
    render(component);

    const input = screen.queryByRole('textbox');

    expect(input).toBeTruthy();

    const json = renderer.create(component).toJSON();

    expect(json).toMatchSnapshot();
  });

  it('should show default placeholder', () => {
    const component = getComponent('');
    render(component);

    const placeholder = screen.queryByPlaceholderText('Enter a registry');
    expect(placeholder).toBeTruthy();
  });

  it('should correctly re-render the component', () => {
    const component = getComponent('http://test');
    const { rerender } = render(component);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('http://test');

    rerender(getComponent('http://testreg.com'));

    expect(input).toHaveValue('http://testreg.com');
  });

  it('should fire onChange event', () => {
    const component = getComponent('http://t');
    render(component);

    const input = screen.getByRole('textbox');

    userEvent.type(input, 'est');

    expect(mockOnChange).toHaveBeenCalledWith('http://te', 'success');
    expect(mockOnChange).toHaveBeenCalledWith('http://tes', 'success');
    expect(mockOnChange).toHaveBeenCalledWith('http://test', 'success');
  });

  describe('validation', () => {
    it('should handle empty value', () => {
      const component = getComponent('https://testreg.com/test1');
      render(component);

      const input = screen.getByRole('textbox');

      userEvent.clear(input);

      const label = screen.queryByText('A value is required.');

      expect(label).toBeTruthy();
      expect(input).toBeInvalid();
    });

    it('should handle maximum value length', () => {
      const component = getComponent('https://testreg.com/test1');
      render(component);

      const input = screen.getByRole('textbox');

      const message = 'The url is too long. The maximum length is 256 characters.';
      const allowedUrl = 'a'.repeat(256);
      let label: HTMLElement | null;

      userEvent.clear(input);
      userEvent.type(input, allowedUrl);

      label = screen.queryByText(message);
      expect(label).toBeFalsy();

      const disallowedUrl = 'a'.repeat(257);

      userEvent.clear(input);
      userEvent.type(input, disallowedUrl);

      label = screen.queryByText(message);
      expect(label).toBeTruthy();
      expect(input).toBeInvalid();
    });
  });
});
