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
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import ImportFromGit from '@/components/ImportFromGit';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const history = createMemoryHistory({
  initialEntries: ['/'],
});

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
      .build();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const component = createSnapshot(store, editorId, editorImage);
    expect(component).toMatchSnapshot();
  });

  test('invalid location', () => {
    renderComponent(store);

    const input = screen.getByRole('textbox');
    expect(input).toBeValid();

    userEvent.paste(input, 'invalid-test-location');

    expect(input).toHaveValue('invalid-test-location');
    expect(input).toBeInvalid();

    const button = screen.getByRole('button', { name: 'Create & Open' });
    expect(button).toBeDisabled();

    userEvent.type(input, '{enter}');
    expect(window.open).not.toHaveBeenCalled();
  });

  describe('valid HTTP location', () => {
    describe('factory URL w/o other parameters', () => {
      test('trim spaces from the input value', () => {
        renderComponent(store);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();
        input.focus();
        userEvent.paste(input, '   http://test-location/  ');
        input.blur();

        expect(input).toHaveValue('http://test-location/');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        userEvent.click(button);
        // the selected editor ID should be added to the URL
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);

        userEvent.type(input, '{enter}');
        expect(window.open).toHaveBeenCalledTimes(2);
      });
      test('editor definition and image are empty', () => {
        renderComponent(store);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();

        userEvent.paste(input, 'http://test-location/');

        expect(input).toHaveValue('http://test-location/');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        userEvent.click(button);
        // the selected editor ID should be added to the URL
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);

        userEvent.type(input, '{enter}');
        expect(window.open).toHaveBeenCalledTimes(2);
      });

      test('editor definition is defined, editor image is empty', () => {
        renderComponent(store, editorId);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();

        userEvent.paste(input, 'http://test-location/');

        expect(input).toHaveValue('http://test-location/');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        userEvent.click(button);
        // the selected editor ID should be added to the URL
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/?che-editor=che-incubator%2Fche-code%2Finsiders',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);

        userEvent.type(input, '{enter}');
        expect(window.open).toHaveBeenCalledTimes(2);
      });

      test('editor definition is empty, editor image is defined', () => {
        renderComponent(store, undefined, editorImage);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();

        userEvent.paste(input, 'http://test-location/');

        expect(input).toHaveValue('http://test-location/');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        userEvent.click(button);
        // the selected editor ID should be added to the URL
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/?editor-image=custom-editor-image',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);

        userEvent.type(input, '{enter}');
        expect(window.open).toHaveBeenCalledTimes(2);
      });

      test('editor definition and editor image are defined', () => {
        renderComponent(store, editorId, editorImage);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();

        userEvent.paste(input, 'http://test-location/');

        expect(input).toHaveValue('http://test-location/');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        userEvent.click(button);
        // the selected editor ID should be added to the URL
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/?che-editor=che-incubator%2Fche-code%2Finsiders&editor-image=custom-editor-image',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);

        userEvent.type(input, '{enter}');
        expect(window.open).toHaveBeenCalledTimes(2);
      });
    });

    describe('factory URL with `che-editor` and/or `editor-image` parameters', () => {
      test('editor definition and editor image are defined, and `che-editor` is provided', () => {
        renderComponent(store, editorId, editorImage);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();

        userEvent.paste(input, 'http://test-location/?che-editor=other-editor-id');

        expect(input).toHaveValue('http://test-location/?che-editor=other-editor-id');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        userEvent.click(button);
        // the selected editor ID should NOT be added to the URL, as the URL parameter has higher priority
        expect(window.open).toHaveBeenLastCalledWith(
          'http://localhost/#http://test-location/?che-editor=other-editor-id',
          '_blank',
        );
        expect(window.open).toHaveBeenCalledTimes(1);

        userEvent.type(input, '{enter}');
        expect(window.open).toHaveBeenCalledTimes(2);
      });

      test('editor definition and editor image are defined, and `editor-image` is provided', () => {
        renderComponent(store, editorId, editorImage);

        const input = screen.getByRole('textbox');
        expect(input).toBeValid();

        userEvent.paste(input, 'http://test-location/?editor-image=custom-editor-image');

        expect(input).toHaveValue('http://test-location/?editor-image=custom-editor-image');
        expect(input).toBeValid();

        const button = screen.getByRole('button', { name: 'Create & Open' });
        expect(button).toBeEnabled();

        userEvent.click(button);
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
    test('w/o SSH keys', () => {
      renderComponent(store, editorId, editorImage);

      const input = screen.getByRole('textbox');
      expect(input).toBeValid();

      input.focus();
      userEvent.paste(input, 'git@github.com:user/repo.git');
      input.blur();

      expect(input).toHaveValue('git@github.com:user/repo.git');
      expect(input).toBeInvalid();

      const buttonCreate = screen.getByRole('button', { name: 'Create & Open' });
      expect(buttonCreate).toBeDisabled();

      const buttonUserPreferences = screen.getByRole('button', { name: 'User Preferences' });

      userEvent.click(buttonUserPreferences);
      expect(history.location.pathname).toBe('/user-preferences');
      expect(history.location.search).toBe('?tab=SshKeys');
    });

    test('with SSH keys, the `che-editor` parameter is omitted', () => {
      const store = new FakeStoreBuilder()
        .withSshKeys({ keys: [{ name: 'key1', keyPub: 'publicKey' }] })
        .build();
      renderComponent(store, editorId, editorImage);

      const input = screen.getByRole('textbox');
      expect(input).toBeValid();

      userEvent.paste(input, 'git@github.com:user/repo.git');

      expect(input).toHaveValue('git@github.com:user/repo.git');
      expect(input).toBeValid();

      const buttonCreate = screen.getByRole('button', { name: 'Create & Open' });
      expect(buttonCreate).toBeEnabled();

      userEvent.click(buttonCreate);

      expect(window.open).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenLastCalledWith(
        'http://localhost/#git@github.com:user/repo.git?che-editor=che-incubator%2Fche-code%2Finsiders&editor-image=custom-editor-image',
        '_blank',
      );
    });

    test('with SSH keys, the `che-editor` parameter is set', () => {
      const store = new FakeStoreBuilder()
        .withSshKeys({ keys: [{ name: 'key1', keyPub: 'publicKey' }] })
        .build();
      renderComponent(store, editorId, editorImage);

      const input = screen.getByRole('textbox');
      expect(input).toBeValid();

      userEvent.paste(input, 'git@github.com:user/repo.git?che-editor=other-editor-id');

      expect(input).toHaveValue('git@github.com:user/repo.git?che-editor=other-editor-id');
      expect(input).toBeValid();

      const buttonCreate = screen.getByRole('button', { name: 'Create & Open' });
      expect(buttonCreate).toBeEnabled();

      userEvent.click(buttonCreate);

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
        history={history}
        editorDefinition={editorDefinition}
        editorImage={editorImage}
      />
    </Provider>
  );
}
