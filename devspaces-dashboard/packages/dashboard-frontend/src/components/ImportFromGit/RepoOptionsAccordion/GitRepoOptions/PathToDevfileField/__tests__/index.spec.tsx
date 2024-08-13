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

import userEvent from '@testing-library/user-event';
import React from 'react';

import { PathToDevfileField } from '@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions/PathToDevfileField';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('PathToDevfileField', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('devfile path preset value', () => {
    renderComponent('preset-devfile-path');

    const input = screen.getByRole('textbox');

    expect(input).toHaveValue('preset-devfile-path');
  });

  test('devfile path change', () => {
    renderComponent();

    const input = screen.getByRole('textbox');

    const devfilePath = 'new-devfile-path';
    userEvent.paste(input, devfilePath);

    expect(mockOnChange).toHaveBeenNthCalledWith(1, devfilePath);

    userEvent.clear(input);
    expect(mockOnChange).toHaveBeenNthCalledWith(2, '');
  });
});

function getComponent(devfilePath?: string) {
  return <PathToDevfileField devfilePath={devfilePath} onChange={mockOnChange} />;
}
