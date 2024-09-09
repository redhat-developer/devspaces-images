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

import { api } from '@eclipse-che/common';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';

import AdditionalGitRemote from '@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions/AdditionalGitRemotes/gitRemote';
import { GitRemote } from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/getGitRemotes';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();
const mockOnDelete = jest.fn();

const callbacks: { getValidation?: () => boolean } = {};

describe('AdditionalGitRemote', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot({ name: 'test-1', url: 'https://test-1.repo.git' });
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  describe('preset git remote', () => {
    describe('valid', () => {
      test('HTTPS remote', () => {
        renderComponent({ name: 'test-1', url: 'https://test-1.repo.git' });

        const inputName = screen.getByPlaceholderText('origin');
        expect(inputName).toHaveValue('test-1');

        const inputURL = screen.getByPlaceholderText('HTTP or SSH URL');
        expect(inputURL).toHaveValue('https://test-1.repo.git');

        const isValidation = callbacks.getValidation ? callbacks.getValidation() : false;
        expect(isValidation).toBe(true);
      });

      test('SSH remote', () => {
        renderComponent({ name: 'test-1', url: 'git@github.com:eclipse-che/che-dashboard.git' }, [
          { name: 'test', keyPub: 'publicKey' },
        ]);

        const inputName = screen.getByPlaceholderText('origin');
        expect(inputName).toHaveValue('test-1');

        const inputURL = screen.getByPlaceholderText('HTTP or SSH URL');
        expect(inputURL).toHaveValue('git@github.com:eclipse-che/che-dashboard.git');

        const isValidation = callbacks.getValidation ? callbacks.getValidation() : false;
        expect(isValidation).toBe(true);
      });
    });

    describe('invalid', () => {
      test('HTTPS remote', () => {
        renderComponent({ name: 'test-1', url: 'htps://test-1.repo.git' });

        const inputName = screen.getByPlaceholderText('origin');
        expect(inputName).toHaveValue('test-1');

        const inputURL = screen.getByPlaceholderText('HTTP or SSH URL');
        expect(inputURL).toHaveValue('htps://test-1.repo.git');

        const error = screen.queryByText('The URL or SSHLocation is not valid');
        expect(error).toBeDefined();

        const isValidation = callbacks.getValidation ? callbacks.getValidation() : true;
        expect(isValidation).toBe(false);
      });

      test('SSH remote', () => {
        renderComponent({ name: 'test-1', url: 'git@github.com:eclipse-che/che-dashboard.git' });

        const inputName = screen.getByPlaceholderText('origin');
        expect(inputName).toHaveValue('test-1');

        const inputURL = screen.getByPlaceholderText('HTTP or SSH URL');
        expect(inputURL).toHaveValue('git@github.com:eclipse-che/che-dashboard.git');

        const error = screen.queryByText('No SSH keys found');
        expect(error).toBeDefined();

        const isValidation = callbacks.getValidation ? callbacks.getValidation() : true;
        expect(isValidation).toBe(false);
      });
    });
  });

  test('delete the remote', async () => {
    renderComponent({ name: 'test-1', url: 'https://test-1.repo.git' });

    const inputName = screen.getByPlaceholderText('origin');
    expect(inputName).toHaveValue('test-1');

    const inputURL = screen.getByPlaceholderText('HTTP or SSH URL');
    expect(inputURL).toHaveValue('https://test-1.repo.git');

    const deleteButton = screen.getByTestId('remove-remote');
    await userEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  test('git remote change', async () => {
    const remote = { name: 'test', url: 'https://test' };
    renderComponent(remote);

    const inputName = screen.getByPlaceholderText('origin');

    await userEvent.click(inputName);
    await userEvent.paste('-updated');

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, { name: 'test-updated', url: 'https://test' });

    const inputURL = screen.getByPlaceholderText('HTTP or SSH URL');

    await userEvent.click(inputURL);
    await userEvent.paste('-updated');

    expect(mockOnChange).toHaveBeenCalledTimes(2);
    expect(mockOnChange).toHaveBeenNthCalledWith(2, {
      name: 'test-updated',
      url: 'https://test-updated',
    });

    await userEvent.clear(inputURL);
    expect(mockOnChange).toHaveBeenNthCalledWith(3, { name: 'test-updated', url: '' });

    await userEvent.paste('https://test2');
    expect(mockOnChange).toHaveBeenNthCalledWith(4, { name: 'test-updated', url: 'https://test2' });
  });
});

function getComponent(remote: GitRemote, keys: api.SshKey[] = []) {
  const store = new FakeStoreBuilder().withSshKeys({ keys }).build();
  return (
    <Provider store={store}>
      <AdditionalGitRemote
        remote={remote}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
        callbacks={callbacks}
      />
    </Provider>
  );
}
