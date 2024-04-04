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
import { StateMock } from '@react-mock/state';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';

import EditorSelector, { State } from '@/components/EditorSelector';
import mockPlugins from '@/pages/GetStarted/__tests__/plugins.json';
import getComponentRenderer, { screen, within } from '@/services/__mocks__/getComponentRenderer';
import { che } from '@/services/models';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

jest.mock('@/components/EditorSelector/Definition');
jest.mock('@/components/EditorSelector/Gallery');

const plugins = mockPlugins as che.Plugin[];

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnSelect = jest.fn();

describe('Editor Selector', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('accordion content toggling', () => {
    renderComponent();

    const defaultEditorButton = screen.getByRole('button', { name: 'Use a Default Editor' });
    const editorGalleryButton = screen.getByRole('button', { name: 'Choose an Editor' });
    const editorDefinitionButton = screen.getByRole('button', { name: 'Use an Editor Definition' });

    // initially the default editor section is visible; the selector and definition sections are not
    expect(screen.getByTestId('default-editor-content')).not.toHaveAttribute('hidden');
    expect(screen.getByTestId('editor-gallery-content')).toHaveAttribute('hidden');
    expect(screen.getByTestId('editor-definition-content')).toHaveAttribute('hidden');

    /* switch to the editor gallery section */

    userEvent.click(editorGalleryButton);

    // now the gallery is visible
    expect(screen.getByTestId('editor-gallery-content')).not.toHaveAttribute('hidden');
    expect(screen.getByTestId('editor-definition-content')).toHaveAttribute('hidden');
    expect(screen.getByTestId('default-editor-content')).toHaveAttribute('hidden');

    /* switch to the editor definition section */

    userEvent.click(editorDefinitionButton);

    // now the editor definition is visible
    expect(screen.getByTestId('editor-definition-content')).not.toHaveAttribute('hidden');
    expect(screen.getByTestId('editor-gallery-content')).toHaveAttribute('hidden');
    expect(screen.getByTestId('default-editor-content')).toHaveAttribute('hidden');

    /* switch back to the default editor section */

    userEvent.click(defaultEditorButton);

    // now the default editor section is visible
    expect(screen.getByTestId('default-editor-content')).not.toHaveAttribute('hidden');
    expect(screen.getByTestId('editor-gallery-content')).toHaveAttribute('hidden');
    expect(screen.getByTestId('editor-definition-content')).toHaveAttribute('hidden');
  });

  test('use a default editor', () => {
    renderComponent();

    expect(screen.getByTestId('default-editor-content')).not.toHaveAttribute('hidden');

    expect(mockOnSelect).not.toHaveBeenCalled();

    const defaultEditorButton = screen.getByRole('button', { name: 'Use a Default Editor' });

    userEvent.click(defaultEditorButton);
    expect(mockOnSelect).toHaveBeenCalledWith(undefined, undefined);
  });

  test('select editor from gallery', () => {
    renderComponent({
      expandedId: 'selector',
      selectorEditorValue: 'some/editor/id',
      definitionEditorValue: undefined,
      definitionImageValue: undefined,
    });

    const editorGallery = screen.getByTestId('editor-gallery-content');
    expect(editorGallery).not.toHaveAttribute('hidden');

    // initial default editor ID
    const defaultEditor = within(editorGallery).getByTestId('default-editor-id');
    expect(defaultEditor).toHaveTextContent('default/editor/id');

    // initial selected editor ID
    const selectedEditor = within(editorGallery).getByTestId('selected-editor-id');
    expect(selectedEditor).toHaveTextContent('some/editor/id');

    const selectEditorButton = within(editorGallery).getByRole('button', {
      name: 'Select Editor',
    });

    userEvent.click(selectEditorButton);

    expect(mockOnSelect).toHaveBeenCalledWith('che-incubator/che-code/latest', undefined);

    // next selected editor ID
    expect(screen.queryByTestId('selected-editor-id')).toHaveTextContent(
      'che-incubator/che-code/latest',
    );
  });

  test('define editor by ID and editor image', () => {
    renderComponent({
      expandedId: 'definition',
      selectorEditorValue: 'some/editor/id',
      definitionEditorValue: undefined,
      definitionImageValue: undefined,
    });

    const editorDefinitionPanel = screen.getByTestId('editor-definition-content');
    expect(editorDefinitionPanel).not.toHaveAttribute('hidden');

    // initial editor definition state
    const editorDefinition = within(editorDefinitionPanel).getByTestId('editor-definition');
    expect(editorDefinition).toBeEmptyDOMElement();

    // initial editor image
    const editorImage = within(editorDefinitionPanel).getByTestId('editor-image');
    expect(editorImage).toBeEmptyDOMElement();

    const changeDefinitionButton = within(editorDefinitionPanel).getByRole('button', {
      name: 'Editor Definition Change',
    });

    userEvent.click(changeDefinitionButton);

    expect(mockOnSelect).toHaveBeenCalledWith('some/editor/id', 'editor-image');

    // next editor definition
    expect(screen.getByTestId('editor-definition')).toHaveTextContent('some/editor/id');
    // next editor image
    expect(screen.getByTestId('editor-image')).toHaveTextContent('editor-image');
  });
});

function getComponent(localState?: State) {
  const store = new FakeStoreBuilder()
    .withPlugins(plugins)
    .withDwServerConfig({
      defaults: {
        editor: 'che-incubator/che-code/insiders',
      } as api.IServerConfig['defaults'],
    })
    .build();

  const component = <EditorSelector defaultEditorId="default/editor/id" onSelect={mockOnSelect} />;

  if (localState) {
    return (
      <Provider store={store}>
        <StateMock state={localState}>{component}</StateMock>
      </Provider>
    );
  }

  return <Provider store={store}>{component}</Provider>;
}
