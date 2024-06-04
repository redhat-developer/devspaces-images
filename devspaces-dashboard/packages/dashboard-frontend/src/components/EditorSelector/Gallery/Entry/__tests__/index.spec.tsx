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

import { EditorSelectorEntry, State } from '@/components/EditorSelector/Gallery/Entry';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { che } from '@/services/models';

const mockOnSelect = jest.fn();

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const editorGroup: che.Plugin[] = [
  {
    id: 'che-incubator/che-code/insiders',
    description: 'Microsoft Visual Studio Code - Open Source IDE for Eclipse Che - Insiders build',
    displayName: 'VS Code - Open Source',
    links: {
      devfile: '/v3/plugins/che-incubator/che-code/insiders/devfile.yaml',
    },
    name: 'che-code',
    publisher: 'che-incubator',
    type: 'Che Editor',
    version: 'insiders',
    icon: 'data:image/svg+xml;charset=utf-8,%2Fv3%2Fimages%2Fvscode.svg',
    iconMediatype: 'image/svg+xml',
  },
  {
    id: 'che-incubator/che-code/latest',
    description: 'Microsoft Visual Studio Code - Open Source IDE for Eclipse Che',
    displayName: 'VS Code - Open Source',
    links: {
      devfile: '/v3/plugins/che-incubator/che-code/latest/devfile.yaml',
    },
    name: 'che-code',
    publisher: 'che-incubator',
    type: 'Che Editor',
    version: 'latest',
    icon: 'data:image/svg+xml;charset=utf-8,%2Fv3%2Fimages%2Fvscode.svg',
    iconMediatype: 'image/svg+xml',
  },
];

const editorGroupIconSrc = editorGroup[0].icon;
const editorGroupIconMediatype = editorGroup[0].iconMediatype || '';
const editorGroupName = editorGroup[0].displayName as string;

describe('Editor Selector Entry', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot('editor-id', editorGroup);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  describe('props change', () => {
    test('sibling editor ID provided later', () => {
      const { reRenderComponent } = renderComponent(editorGroup[0].id, editorGroup);

      expect(screen.getByRole('checkbox')).toBeChecked();

      reRenderComponent(editorGroup[1].id, editorGroup);

      expect(screen.getByRole('checkbox')).toBeChecked();

      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    test('other editor ID provided later', () => {
      const { reRenderComponent } = renderComponent(editorGroup[0].id, editorGroup);

      expect(screen.getByRole('checkbox')).toBeChecked();

      reRenderComponent('other/editor/id', editorGroup);

      expect(screen.getByRole('checkbox')).not.toBeChecked();

      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('card click', () => {
    test('card is selected initially', () => {
      renderComponent(editorGroup[0].id, editorGroup);

      const card = screen.getByRole('article');
      card.click();

      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    test('card is not selected initially', () => {
      renderComponent('other/editor/id', editorGroup);

      const card = screen.getByRole('article');
      card.click();

      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  describe('card actions', () => {
    test('kebab click', () => {
      renderComponent(editorGroup[0].id, editorGroup);

      const kebab = screen.getByRole('button', { name: 'Actions' });
      kebab.click();

      expect(screen.getByRole('menu')).toBeInTheDocument();

      const dropdownItems = screen.getAllByRole('menuitem');
      expect(dropdownItems).toHaveLength(2);
    });

    describe('card is selected', () => {
      const localState: Partial<State> = {
        activeEditor: editorGroup[0],
        isKebabOpen: true,
        isSelectedGroup: true, // card is selected
      };

      test('select same version', () => {
        renderComponent(editorGroup[0].id, editorGroup, localState);

        const activeDropdownItem = screen.getByRole('menuitem', {
          name: localState.activeEditor!.version,
        });

        expect(activeDropdownItem).toHaveAttribute('aria-checked', 'true');

        userEvent.click(activeDropdownItem);

        // should NOT call onSelect
        expect(mockOnSelect).not.toHaveBeenCalled();
      });

      test('select different version', () => {
        renderComponent(editorGroup[0].id, editorGroup, localState);

        const dropdownItem = screen.getByRole('menuitem', { name: editorGroup[1].version });

        expect(dropdownItem).toHaveAttribute('aria-checked', 'false');

        userEvent.click(dropdownItem);

        // should call onSelect
        expect(mockOnSelect).toHaveBeenCalled();
      });
    });

    describe('card is not selected', () => {
      const localState: Partial<State> = {
        activeEditor: editorGroup[0],
        isKebabOpen: true,
        isSelectedGroup: false, // card is not selected
      };

      test('select same version', () => {
        renderComponent('other/editor/id', editorGroup, localState);

        const activeDropdownItem = screen.getByRole('menuitem', {
          name: localState.activeEditor!.version,
        });

        expect(activeDropdownItem).toHaveAttribute('aria-checked', 'true');

        userEvent.click(activeDropdownItem);

        // should NOT call onSelect
        expect(mockOnSelect).not.toHaveBeenCalled();
      });

      test('select different version', () => {
        renderComponent('other/editor/id', editorGroup, localState);

        const dropdownItem = screen.getByRole('menuitem', { name: editorGroup[1].version });

        expect(dropdownItem).toHaveAttribute('aria-checked', 'false');

        userEvent.click(dropdownItem);

        // should NOT call onSelect
        expect(mockOnSelect).not.toHaveBeenCalled();
      });

      test('select different version and select the card', () => {
        renderComponent('other/editor/id', editorGroup, localState);

        const dropdownItem = screen.getByRole('menuitem', { name: editorGroup[1].version });

        expect(dropdownItem).toHaveAttribute('aria-checked', 'false');

        userEvent.click(dropdownItem);

        // should NOT call onSelect
        expect(mockOnSelect).not.toHaveBeenCalled();

        const card = screen.getByRole('article');
        userEvent.click(card);

        // should call onSelect
        expect(mockOnSelect).toHaveBeenCalledWith(editorGroup[1].id);
      });
    });
  });
});

function getComponent(
  selectedEditorId: string,
  editorGroup: che.Plugin[],
  localState?: Partial<State>,
) {
  const component = (
    <EditorSelectorEntry
      editorsGroup={editorGroup}
      groupIcon={editorGroupIconSrc}
      groupIconMediatype={editorGroupIconMediatype}
      groupName={editorGroupName}
      selectedId={selectedEditorId}
      onSelect={mockOnSelect}
    />
  );

  if (localState) {
    return <StateMock state={localState}>{component}</StateMock>;
  }

  return component;
}
