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

import GetStarted from '@/pages/GetStarted';
import getComponentRenderer, { screen, within } from '@/services/__mocks__/getComponentRenderer';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

jest.mock('@/components/EditorSelector');
jest.mock('@/pages/GetStarted/SamplesList');
jest.mock('@/components/ImportFromGit');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('GetStarted', () => {
  test('snapshot', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('editor definition change', () => {
    renderComponent();

    // initial state of import from git
    {
      const importFromGit = screen.getByTestId('import-from-git');
      const ifgEditorDefinition = within(importFromGit).getByTestId('editor-definition');
      expect(ifgEditorDefinition).toHaveTextContent('');
      const ifgEditorImage = within(importFromGit).getByTestId('editor-image');
      expect(ifgEditorImage).toHaveTextContent('');
    }

    // initial state of samples list
    {
      const samplesList = screen.getByTestId('samples-list');
      const slEditorDefinition = within(samplesList).getByTestId('editor-definition');
      expect(slEditorDefinition).toHaveTextContent('');
      const slEditorImage = within(samplesList).getByTestId('editor-image');
      expect(slEditorImage).toHaveTextContent('');
    }

    const button = screen.getByRole('button', { name: 'Select Editor' });
    userEvent.click(button);

    // next state of import from git
    {
      const importFromGit = screen.getByTestId('import-from-git');
      const ifgEditorDefinition = within(importFromGit).getByTestId('editor-definition');
      expect(ifgEditorDefinition).toHaveTextContent('some/editor/id');
      const ifgEditorImage = within(importFromGit).getByTestId('editor-image');
      expect(ifgEditorImage).toHaveTextContent('custom-editor-image');
    }

    // next state of samples list
    {
      const samplesList = screen.getByTestId('samples-list');
      const slEditorDefinition = within(samplesList).getByTestId('editor-definition');
      expect(slEditorDefinition).toHaveTextContent('some/editor/id');
      const slEditorImage = within(samplesList).getByTestId('editor-image');
      expect(slEditorImage).toHaveTextContent('custom-editor-image');
    }
  });
});

function getComponent() {
  const store = new FakeStoreBuilder().build();
  const history = createMemoryHistory();
  return (
    <Provider store={store}>
      <GetStarted history={history} />
    </Provider>
  );
}
