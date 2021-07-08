/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import { DevfileLocationInput } from '../DevfileLocationInput';

describe('Devfile Location', () => {

  const mockOnChange = jest.fn();

  function renderComponent(): RenderResult {
    return render(
      <DevfileLocationInput
        onChange={mockOnChange}
      />
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have button initially disabled', () => {
    renderComponent();

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should invalidate input for non-URL string', () => {
    renderComponent();

    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'abcd' } });
    expect(input).toBeInvalid();
  });

  it('should validate input for URL-like string', () => {
    renderComponent();

    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'http://resource/location' } });
    expect(input).toBeValid();
  });

  it('should fire "onChange"', () => {
    renderComponent();

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'http://resource/location' } });
    fireEvent.click(button);

    expect(mockOnChange).toHaveBeenCalledWith('http://resource/location');
  });

});
