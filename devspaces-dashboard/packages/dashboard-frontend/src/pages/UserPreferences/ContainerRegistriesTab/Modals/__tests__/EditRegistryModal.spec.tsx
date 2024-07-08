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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import renderer from 'react-test-renderer';

import { FakeRegistryBuilder } from '@/pages/UserPreferences/ContainerRegistriesTab/__tests__/__mocks__/registryRowBuilder';
import EditRegistryModal from '@/pages/UserPreferences/ContainerRegistriesTab/Modals/EditRegistryModal';
import { RegistryEntry } from '@/store/DockerConfig/types';

describe('Edit Registry Modal', () => {
  const mockOnChange = jest.fn();
  const mockOnCancel = jest.fn();

  function getComponent(
    isModalOpen: boolean,
    isEditMode: boolean,
    currentRegistry: RegistryEntry,
  ): React.ReactElement {
    return (
      <EditRegistryModal
        onCancel={mockOnCancel}
        onChange={mockOnChange}
        isEditMode={isEditMode}
        registry={currentRegistry}
        isOpen={isModalOpen}
      />
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render the closed modal component', () => {
    const registry = new FakeRegistryBuilder().build();
    const component = getComponent(false, false, registry);

    const json = renderer.create(component).toJSON();

    expect(json).toMatchSnapshot();
  });

  it('should correctly render the edit registry component', () => {
    const registry = new FakeRegistryBuilder()
      .withUrl('http://test.reg')
      .withPassword('tst')
      .build();
    const component = getComponent(true, true, registry);
    const { rerender } = render(component);

    const editRegistryTitle = screen.queryByText('Edit Container Registry');
    expect(editRegistryTitle).toBeTruthy();

    const editButton = screen.queryByTestId('edit-button');
    expect(editButton).toBeTruthy();

    const cancelButton = screen.queryByTestId('cancel-button');
    expect(cancelButton).toBeTruthy();

    rerender(getComponent(true, false, new FakeRegistryBuilder().build()));
    const addRegistryTitle = screen.queryByText('Add Container Registry');
    expect(addRegistryTitle).toBeTruthy();
  });

  it('should fire onChange registries event', () => {
    const registry = new FakeRegistryBuilder()
      .withUrl('http://test')
      .withPassword('qwerty')
      .build();
    const component = getComponent(true, true, registry);
    render(component);

    const editButton = screen.getByTestId('edit-button');
    expect(editButton).toBeTruthy();
    expect(editButton).toBeDisabled();

    const urlInput = screen.getByLabelText('Url input');
    userEvent.type(urlInput, '.com');
    expect(editButton).toBeEnabled();

    userEvent.click(editButton);
    expect(mockOnChange).toHaveBeenCalledWith(
      Object.assign({}, registry, { url: 'http://test.com' }),
    );
  });

  it('should fire onCancel event', () => {
    const component = getComponent(true, false, new FakeRegistryBuilder().build());
    render(component);

    const cancelButton = screen.getByTestId('cancel-button');
    userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
