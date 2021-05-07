/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
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
import { RenderResult, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import mockMetadata from '../../../__tests__/devfileMetadata.json';
import { DevfileSelect } from '../DevfileSelect';

describe('Infrastructure Namespace Select', () => {

  const mockOnClear = jest.fn();
  const mockOnSelect = jest.fn();

  function renderSelect(): RenderResult {
    return render(
      <DevfileSelect
        metadata={mockMetadata}
        onClear={mockOnClear}
        onSelect={mockOnSelect}
      />
    );
  }

  let selectTextbox: HTMLInputElement;
  let selectToggleButton: HTMLButtonElement;
  beforeEach(() => {
    renderSelect();

    selectTextbox = screen.getByRole('textbox', { name: /Select a devfile template/ }) as HTMLInputElement;
    selectToggleButton = screen.getByRole('button', { name: /Select a devfile template/ }) as HTMLButtonElement;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render component correctly', () => {
    expect(selectTextbox).not.toHaveValue();
  });

  it('should fire "onSelect" event with selected metadata', () => {
    /* toggle options list */
    fireEvent.click(selectToggleButton);

    /* select an option */
    const selectOption = screen.getByText('Java Gradle');
    fireEvent.click(selectOption);

    const javaGradleMetadata = mockMetadata.find(meta => meta.displayName === 'Java Gradle');
    expect(mockOnSelect).toHaveBeenCalledWith(javaGradleMetadata);
  });

  describe('filtering templates', () => {

    let filterClearButton: HTMLButtonElement;
    beforeEach(async () => {
      /* type into filter field */
      userEvent.type(selectTextbox, 'java');

      /* wait until filtered options appear */
      await waitFor(() => {
        screen.queryAllByText(/java/i);
      });

      filterClearButton = screen.getByRole('button', { name: /clear all/i }) as HTMLButtonElement;
    });

    it('should clear the user input in textbox', () => {
      /* click on the button that clears filter field */
      userEvent.click(filterClearButton);

      expect(selectTextbox).not.toHaveValue();
    });

    it('should fire "onClear" event', () => {
      userEvent.click(filterClearButton);

      expect(mockOnClear).toHaveBeenCalled();
    });

    it('should show number of filtered options', () => {
      expect(selectTextbox).toHaveValue('java');

      const filteredOptions = screen.getAllByRole('option');
      expect(filteredOptions.length).toEqual(6);
    });

    it('should process empty filter value', async () => {
      /* remove previously typed value from filter field */
      userEvent.clear(selectTextbox);

      const filteredOptions = screen.getAllByRole('option');
      expect(filteredOptions.length).toEqual(mockMetadata.length);
    });

  });

});
