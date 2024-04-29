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

import { AdditionalGitRemotes } from '@/components/ImportFromGit/GitRepoOptions/AdditionalGitRemotes';
import { GitRemote } from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/getGitRemotes';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('AdditionalGitRemotesField', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot([
      { name: 'test-1', url: 'https://test-1.repo.git' },
      { name: 'test-2', url: 'https://test-2.repo.git' },
      { name: 'test-3', url: 'https://test-3.repo.git' },
    ]);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  describe('preset git remotes', () => {
    test('empty value', async () => {
      renderComponent();

      const inputNames = await screen.findAllByPlaceholderText('origin');
      expect(inputNames.length).toBe(1);
      expect(inputNames[0]).toHaveValue('');

      const inputURLs = await screen.findAllByPlaceholderText('HTTP or SSH URL');
      expect(inputURLs.length).toBe(1);
      expect(inputNames[0]).toHaveValue('');
    });

    test('valid remotes', async () => {
      renderComponent([
        { name: 'test-1', url: 'https://test-1.repo.git' },
        { name: 'test-2', url: 'https://test-2.repo.git' },
        { name: 'test-3', url: 'https://test-3.repo.git' },
      ]);

      const inputNames = await screen.findAllByPlaceholderText('origin');
      expect(inputNames.length).toBe(3);
      expect(inputNames[0]).toHaveValue('test-1');
      expect(inputNames[1]).toHaveValue('test-2');
      expect(inputNames[2]).toHaveValue('test-3');

      const inputURLs = await screen.findAllByPlaceholderText('HTTP or SSH URL');
      expect(inputURLs.length).toBe(3);
      expect(inputURLs[0]).toHaveValue('https://test-1.repo.git');
      expect(inputURLs[1]).toHaveValue('https://test-2.repo.git');
      expect(inputURLs[2]).toHaveValue('https://test-3.repo.git');
    });
  });

  test('add a new remote', async () => {
    renderComponent([
      { name: 'test-1', url: 'https://test-1.repo.git' },
      { name: 'test-2', url: 'https://test-2.repo.git' },
      { name: 'test-3', url: 'https://test-3.repo.git' },
    ]);

    const inputNames = await screen.findAllByPlaceholderText('origin');
    expect(inputNames.length).toBe(3);
    expect(inputNames[0]).toHaveValue('test-1');
    expect(inputNames[1]).toHaveValue('test-2');
    expect(inputNames[2]).toHaveValue('test-3');

    const inputURLs = await screen.findAllByPlaceholderText('HTTP or SSH URL');
    expect(inputURLs.length).toBe(3);
    expect(inputURLs[0]).toHaveValue('https://test-1.repo.git');
    expect(inputURLs[1]).toHaveValue('https://test-2.repo.git');
    expect(inputURLs[2]).toHaveValue('https://test-3.repo.git');

    const buttonAdd = screen.getByRole('button', { name: 'Add Remote' });
    userEvent.click(buttonAdd);

    const inputNamesAfter = await screen.findAllByPlaceholderText('origin');
    expect(inputNamesAfter.length).toBe(4);
    expect(inputNamesAfter[0]).toHaveValue('test-1');
    expect(inputNamesAfter[1]).toHaveValue('test-2');
    expect(inputNamesAfter[2]).toHaveValue('test-3');
    expect(inputNamesAfter[3]).toHaveValue('');

    const inputURLsAfter = await screen.findAllByPlaceholderText('HTTP or SSH URL');
    expect(inputURLsAfter.length).toBe(4);
    expect(inputURLsAfter[0]).toHaveValue('https://test-1.repo.git');
    expect(inputURLsAfter[1]).toHaveValue('https://test-2.repo.git');
    expect(inputURLsAfter[2]).toHaveValue('https://test-3.repo.git');
    expect(inputURLsAfter[3]).toHaveValue('');

    expect(mockOnChange).toHaveBeenNthCalledWith(
      2,
      [
        { name: 'test-1', url: 'https://test-1.repo.git' },
        { name: 'test-2', url: 'https://test-2.repo.git' },
        { name: 'test-3', url: 'https://test-3.repo.git' },
        { name: '', url: '' },
      ],
      true,
    );
  });

  test('delete the remote', async () => {
    renderComponent([
      { name: 'test-1', url: 'https://test-1.repo.git' },
      { name: 'test-2', url: 'https://test-2.repo.git' },
      { name: 'test-3', url: 'https://test-3.repo.git' },
    ]);

    const inputNames = await screen.findAllByPlaceholderText('origin');
    expect(inputNames.length).toBe(3);
    expect(inputNames[0]).toHaveValue('test-1');
    expect(inputNames[1]).toHaveValue('test-2');
    expect(inputNames[2]).toHaveValue('test-3');

    const inputURLs = await screen.findAllByPlaceholderText('HTTP or SSH URL');
    expect(inputURLs.length).toBe(3);
    expect(inputURLs[0]).toHaveValue('https://test-1.repo.git');
    expect(inputURLs[1]).toHaveValue('https://test-2.repo.git');
    expect(inputURLs[2]).toHaveValue('https://test-3.repo.git');

    const removeButton = screen.getAllByTestId('remove-remote');
    userEvent.click(removeButton[0]);

    const inputNamesAfter = await screen.findAllByPlaceholderText('origin');
    expect(inputNamesAfter.length).toBe(2);
    expect(inputNamesAfter[0]).toHaveValue('test-2');
    expect(inputNamesAfter[1]).toHaveValue('test-3');

    const inputURLsAfter = await screen.findAllByPlaceholderText('HTTP or SSH URL');
    expect(inputURLsAfter.length).toBe(2);
    expect(inputURLsAfter[0]).toHaveValue('https://test-2.repo.git');
    expect(inputURLsAfter[1]).toHaveValue('https://test-3.repo.git');

    expect(mockOnChange).toHaveBeenNthCalledWith(
      2,
      [
        { name: 'test-2', url: 'https://test-2.repo.git' },
        { name: 'test-3', url: 'https://test-3.repo.git' },
      ],
      true,
    );
  });

  test('git remotes change', async () => {
    const remote = { name: 'test', url: 'https://test' };
    renderComponent([remote]);

    const inputNames = await screen.findAllByPlaceholderText('origin');
    expect(inputNames.length).toBe(1);

    const inputURLs = await screen.findAllByPlaceholderText('HTTP or SSH URL');
    expect(inputURLs.length).toBe(1);

    userEvent.paste(inputNames[0], '-updated');

    expect(mockOnChange).toHaveBeenCalledTimes(2);
    expect(mockOnChange).toHaveBeenNthCalledWith(
      2,
      [{ name: 'test-updated', url: 'https://test' }],
      true,
    );

    userEvent.paste(inputURLs[0], '-updated');

    expect(mockOnChange).toHaveBeenCalledTimes(3);
    expect(mockOnChange).toHaveBeenNthCalledWith(
      3,
      [{ name: 'test-updated', url: 'https://test-updated' }],
      true,
    );

    userEvent.clear(inputURLs[0]);
    expect(mockOnChange).toHaveBeenNthCalledWith(4, [{ name: 'test-updated', url: '' }], false);

    userEvent.paste(inputURLs[0], 'https://test2');
    expect(mockOnChange).toHaveBeenNthCalledWith(
      5,
      [{ name: 'test-updated', url: 'https://test2' }],
      true,
    );
  });
});

function getComponent(remotes?: GitRemote[], keys: api.SshKey[] = []) {
  const store = new FakeStoreBuilder().withSshKeys({ keys }).build();
  return (
    <Provider store={store}>
      <AdditionalGitRemotes remotes={remotes} onChange={mockOnChange} />
    </Provider>
  );
}
