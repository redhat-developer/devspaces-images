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

  test('accordion content toggling', async () => {
    renderComponent();

    const editorGalleryButton = screen.getByRole('button', { name: 'Choose an Editor' });
    const editorDefinitionButton = screen.getByRole('button', { name: 'Use an Editor Definition' });

    // initially the gallery is visible and the definition is not
    await expect(screen.findByTestId('editor-gallery-content')).resolves.toBeInTheDocument();

    userEvent.click(editorDefinitionButton);

    // now the gallery is not visible and the definition is
    await expect(screen.findByTestId('editor-definition-content')).resolves.toBeInTheDocument();

    userEvent.click(editorGalleryButton);

    // now the gallery is visible and the definition is not
    await expect(screen.findByTestId('editor-gallery-content')).resolves.toBeInTheDocument();
  });

  test('select editor from gallery', () => {
    renderComponent();

    const editorGallery = screen.queryByTestId('editor-gallery-content')!;
    expect(editorGallery).not.toBeNull();

    // initial default editor ID
    const defaultEditor = within(editorGallery).getByTestId('default-editor-id');
    expect(defaultEditor).toHaveTextContent('default/editor/id');

    // initial selected editor ID
    const selectedEditor = within(editorGallery).getByTestId('selected-editor-id');
    expect(selectedEditor).toHaveTextContent('');

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

    const editorDefinitionPanel = screen.queryByTestId('editor-definition-content')!;
    expect(editorDefinitionPanel).not.toBeNull();

    // initial editor definition state
    const editorDefinition = within(editorDefinitionPanel).getByTestId('editor-definition');
    expect(editorDefinition).toHaveTextContent('');

    // initial editor image
    const editorImage = within(editorDefinitionPanel).getByTestId('editor-image');
    expect(editorImage).toHaveTextContent('');

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
