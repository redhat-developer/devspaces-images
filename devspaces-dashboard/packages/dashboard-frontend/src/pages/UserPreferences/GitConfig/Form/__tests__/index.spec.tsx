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

import { StateMock } from '@react-mock/state';
import userEvent from '@testing-library/user-event';
import React from 'react';

import getComponentRenderer, { screen, waitFor } from '@/services/__mocks__/getComponentRenderer';

import { GitConfigForm, Props, State } from '..';

jest.mock('@/pages/UserPreferences/GitConfig/Form/SectionUser');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnSave = jest.fn();
const mockOnReload = jest.fn();

const defaultProps: Props = {
  isLoading: false,
  gitConfig: {
    user: {
      email: 'test@che',
      name: 'test',
    },
  },
  onSave: mockOnSave,
  onReload: mockOnReload,
};
const defaultState: State = {
  isValid: true,
  nextGitConfig: undefined,
};

describe('GitConfigForm', () => {
  test('snapshot', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  describe('buttons state', () => {
    test('initial', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Reload' })).toBeEnabled();
    });

    test('while loading data', () => {
      renderComponent({ isLoading: true });

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Reload' })).toBeDisabled();
    });

    test('with valid changes', () => {
      renderComponent(
        {},
        { isValid: true, nextGitConfig: { user: { name: 'new name', email: 'test@che' } } },
      );

      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Reload' })).toBeEnabled();
    });

    test('with invalid changes', () => {
      renderComponent(
        {},
        { isValid: false, nextGitConfig: { user: { name: '', email: 'test@che' } } },
      );

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Reload' })).toBeEnabled();
    });

    test('handle valid changes', async () => {
      renderComponent();

      // state with no changes
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Reload' })).toBeEnabled();

      const changeEmailButton = screen.getByRole('button', { name: 'Change Email Valid' });
      await userEvent.click(changeEmailButton);

      // state with valid changes
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Reload' })).toBeEnabled();
    });
  });

  test('handle the Reload button click', async () => {
    renderComponent(
      {},
      { isValid: true, nextGitConfig: { user: { name: 'new name', email: 'test@che' } } },
    );

    // expect the name to be changed
    expect(screen.getByTestId('user-name')).toHaveTextContent('new name');

    const reloadButton = screen.getByRole('button', { name: 'Reload' });
    await userEvent.click(reloadButton);

    expect(mockOnReload).toHaveBeenCalled();

    // expect the name to be reverted
    await waitFor(() => expect(screen.getByTestId('user-name')).toHaveTextContent('test'));
  });

  test('handle the Save button click', () => {
    renderComponent(
      {},
      { isValid: true, nextGitConfig: { user: { name: 'new name', email: 'test@che' } } },
    );

    screen.getByRole('button', { name: 'Save' }).click();

    expect(mockOnSave).toHaveBeenCalledWith({ user: { name: 'new name', email: 'test@che' } });
  });
});

function getComponent(props: Partial<Props> = {}, state: Partial<State> = {}): React.ReactElement {
  const localState = { ...defaultState, ...state };
  return (
    <StateMock state={localState}>
      <GitConfigForm {...defaultProps} {...props} />
    </StateMock>
  );
}
