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

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import * as GitConfigStore from '@/store/GitConfig';

import { GitConfigForm } from '..';

const mockOnChange = jest.fn();

jest.mock('@/pages/UserPreferences/GitConfig/GitConfigImport');

const { renderComponent, createSnapshot } = getComponentRenderer(getComponent);

describe('GitConfigForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot without predefined git configuration', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });
  test('snapshot with predefined git configuration', () => {
    const snapshot = createSnapshot({ user: { email: 'user-1@chetest.com', name: 'User One' } });
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should handle a valid value', () => {
    renderComponent();

    const gitConfigField = screen.getByTestId('submit-valid-git-config');
    userEvent.click(gitConfigField);

    expect(mockOnChange).toHaveBeenCalledWith(
      { user: { email: 'user-1@chetest.com', name: 'User One' } },
      true,
    );
  });

  it('should handle an invalid value', () => {
    renderComponent();

    const gitConfigField = screen.getByTestId('submit-invalid-git-config');
    userEvent.click(gitConfigField);

    expect(mockOnChange).toHaveBeenCalledWith({ user: { name: 'User One' } }, false);
  });
});

function getComponent(gitConfig?: GitConfigStore.GitConfig) {
  return <GitConfigForm onChange={mockOnChange} gitConfig={gitConfig} />;
}
