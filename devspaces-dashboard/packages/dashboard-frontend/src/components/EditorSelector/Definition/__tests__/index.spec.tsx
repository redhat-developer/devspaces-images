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

import { EditorDefinition } from '@/components/EditorSelector/Definition';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

jest.mock('@/components/EditorSelector/Definition/DefinitionField');
jest.mock('@/components/EditorSelector/Definition/ImageField');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('EditorDefinition', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot w/o initial values', () => {
    const snapshot = createSnapshot(undefined, undefined);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot with initial values', () => {
    const snapshot = createSnapshot('some/editor/id', 'editor-image');
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should handle editor definition change', () => {
    renderComponent(undefined, undefined);

    const definitionChangeButton = screen.getByRole('button', { name: 'Editor Definition Change' });
    userEvent.click(definitionChangeButton);

    expect(mockOnChange).toHaveBeenCalledWith('some/editor/id', undefined);
  });

  it('should handle editor image change', () => {
    renderComponent(undefined, undefined);

    const imageChangeButton = screen.getByRole('button', { name: 'Editor Image Change' });
    userEvent.click(imageChangeButton);

    expect(mockOnChange).toHaveBeenCalledWith(undefined, 'editor-image');
  });
});

function getComponent(editorDefinition: string | undefined, editorImage: string | undefined) {
  return (
    <EditorDefinition
      editorDefinition={editorDefinition}
      editorImage={editorImage}
      onChange={mockOnChange}
    />
  );
}
