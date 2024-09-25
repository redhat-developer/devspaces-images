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
import { Provider } from 'react-redux';
import { Store } from 'redux';

import ImportFromGit from '@/components/ImportFromGit';
import getComponentRenderer, { screen, waitFor } from '@/services/__mocks__/getComponentRenderer';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

jest.mock('@/components/UntrustedSourceModal');

const mockNavigate = jest.fn();

global.window.open = jest.fn();

const defaultEditorId = 'che-incubator/che-code/next';
const editorId = 'che-incubator/che-code/insiders';
const editorImage = 'custom-editor-image';

// mute the outputs
console.error = jest.fn();

describe('GitRepoLocationInput', () => {
  let store: Store;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withDwServerConfig({
        defaults: {
          editor: defaultEditorId,
          components: [],
          plugins: [],
          pvcStrategy: 'per-workspace',
        },
      })
      .withWorkspacePreferences({
        'trusted-sources': '*',
      })
      .build();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const component = createSnapshot(store, editorId, editorImage);
    expect(component).toMatchSnapshot();
  });

  test('invalid location', async () => {
    renderComponent(store);

    const input = screen.getByRole('textbox');
    expect(input).toBeValid();

    await userEvent.click(input);
    await userEvent.paste('invalid-test-location');

    expect(input).toHaveValue('invalid-test-location');
    expect(input).toBeInvalid();

    const button = screen.getByRole('button', { name: 'Create & Open' });
    expect(button).toBeDisabled();

    await userEvent.type(input, '{enter}');
    expect(window.open).not.toHaveBeenCalled();
  });

  describe('valid HTTP location', () => {
    describe('factory URL w/o other parameters', () => {
      test('trim spaces from the input value', async () => {
        renderComponent(store);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();
        await userEvent.click(input);
        await userEvent.paste('   http://test-location/  ');
        input.blur();

        await waitFor(() => expect(input).toHaveValue('http://test-location/'));
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        await userEvent.click(button);

        // trust the resource
        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await userEvent.click(continueButton);

        // the selected editor ID should be added to the URL
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);
      });

      test('editor definition and image are empty', async () => {
        renderComponent(store);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();

        await userEvent.click(input);
        await userEvent.paste('http://test-location/');

        expect(input).toHaveValue('http://test-location/');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        await userEvent.click(button);

        // trust the resource
        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await userEvent.click(continueButton);

        // the selected editor ID should be added to the URL
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);
      });

      test('editor definition is defined, editor image is empty', async () => {
        renderComponent(store, editorId);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();

        await userEvent.click(input);
        await userEvent.paste('http://test-location/');

        expect(input).toHaveValue('http://test-location/');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        await userEvent.click(button);

        // trust the resource
        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await userEvent.click(continueButton);

        // the selected editor ID should be added to the URL
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/?che-editor=che-incubator%2Fche-code%2Finsiders',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);
      });

      test('editor definition is empty, editor image is defined', async () => {
        renderComponent(store, undefined, editorImage);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();

        await userEvent.click(input);
        await userEvent.paste('http://test-location/');

        expect(input).toHaveValue('http://test-location/');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        await userEvent.click(button);

        // trust the resource
        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await userEvent.click(continueButton);

        // the selected editor ID should be added to the URL
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/?editor-image=custom-editor-image',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);
      });

      test('editor definition and editor image are defined', async () => {
        renderComponent(store, editorId, editorImage);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();

        await userEvent.click(input);
        await userEvent.paste('http://test-location/');

        expect(input).toHaveValue('http://test-location/');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        await userEvent.click(button);

        // trust the resource
        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await userEvent.click(continueButton);

        // the selected editor ID should be added to the URL
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/?che-editor=che-incubator%2Fche-code%2Finsiders&editor-image=custom-editor-image',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);
      });
    });

    describe('factory URL with `che-editor` and/or `editor-image` parameters', () => {
      test('editor definition and editor image are defined, and `che-editor` is provided', async () => {
        renderComponent(store, editorId, editorImage);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();

        await userEvent.click(input);
        await userEvent.paste('http://test-location/?che-editor=other-editor-id');

        expect(input).toHaveValue('http://test-location/?che-editor=other-editor-id');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        await userEvent.click(button);

        // trust the resource
        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await userEvent.click(continueButton);

        // the selected editor ID should NOT be added to the URL, as the URL parameter has higher priority
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/?che-editor=other-editor-id',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);
      });

      test('editor definition and editor image are defined, and `editor-image` is provided', async () => {
        renderComponent(store, editorId, editorImage);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();

        await userEvent.click(input);
        await userEvent.paste('http://test-location/?editor-image=custom-editor-image');

        expect(input).toHaveValue('http://test-location/?editor-image=custom-editor-image');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        await userEvent.click(button);

        // trust the resource
        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await userEvent.click(continueButton);

        // the selected editor ID should be added to the URL
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/?editor-image=custom-editor-image',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('valid Git+SSH location', () => {
    test('w/o SSH keys', async () => {
      renderComponent(store, editorId, editorImage);

      const input = screen.getByRole('textbox');
      expect(input).toBeValid();

      await userEvent.click(input);
      await userEvent.paste('git@github.com:user/repo.git');
      input.blur();

      expect(input).toHaveValue('git@github.com:user/repo.git');
      expect(input).toBeInvalid();

      const buttonCreate = screen.getByRole('button', { name: 'Create & Open' });
      expect(buttonCreate).toBeDisabled();

      const buttonUserPreferences = screen.getByRole('button', { name: 'User Preferences' });

      await userEvent.click(buttonUserPreferences);
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/user-preferences',
          search: '?tab=SshKeys',
        }),
      );
    });

    test('with SSH keys, the `che-editor` parameter is omitted', async () => {
      const store = new FakeStoreBuilder()
        .withSshKeys({ keys: [{ name: 'key1', keyPub: 'publicKey' }] })
        .withWorkspacePreferences({
          'trusted-sources': '*',
        })
        .build();
      renderComponent(store, editorId, editorImage);

      const input = screen.getByRole('textbox');
      expect(input).toBeValid();

      await userEvent.click(input);
      await userEvent.paste('git@github.com:user/repo.git');

      expect(input).toHaveValue('git@github.com:user/repo.git');
      expect(input).toBeValid();

      const buttonCreate = screen.getByRole('button', { name: 'Create & Open' });
      expect(buttonCreate).toBeEnabled();

      await userEvent.click(buttonCreate);

      // trust the resource
      const continueButton = screen.getByRole('button', { name: 'Continue' });
      await userEvent.click(continueButton);

      expect(window.open).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenLastCalledWith(
        'http://localhost/#git@github.com:user/repo.git?che-editor=che-incubator%2Fche-code%2Finsiders&editor-image=custom-editor-image',
        '_blank',
      );
    });

    test('with SSH keys, the `che-editor` parameter is set', async () => {
      const store = new FakeStoreBuilder()
        .withSshKeys({ keys: [{ name: 'key1', keyPub: 'publicKey' }] })
        .withWorkspacePreferences({
          'trusted-sources': '*',
        })
        .build();
      renderComponent(store, editorId, editorImage);

      const input = screen.getByRole('textbox');
      expect(input).toBeValid();

      await userEvent.click(input);
      await userEvent.paste('git@github.com:user/repo.git?che-editor=other-editor-id');

      expect(input).toHaveValue('git@github.com:user/repo.git?che-editor=other-editor-id');
      expect(input).toBeValid();

      const buttonCreate = screen.getByRole('button', { name: 'Create & Open' });
      expect(buttonCreate).toBeEnabled();

      await userEvent.click(buttonCreate);

      // trust the resource
      const continueButton = screen.getByRole('button', { name: 'Continue' });
      await userEvent.click(continueButton);

      expect(window.open).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenLastCalledWith(
        'http://localhost/#git@github.com:user/repo.git?che-editor=other-editor-id',
        '_blank',
      );
    });
  });
});

function getComponent(
  store: Store,
  editorDefinition: string | undefined = undefined,
  editorImage: string | undefined = undefined,
) {
  return (
    <Provider store={store}>
      <ImportFromGit
        navigate={mockNavigate}
        editorDefinition={editorDefinition}
        editorImage={editorImage}
      />
    </Provider>
  );
}
