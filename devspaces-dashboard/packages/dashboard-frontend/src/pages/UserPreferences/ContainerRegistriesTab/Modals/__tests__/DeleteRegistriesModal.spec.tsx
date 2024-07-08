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
import DeleteRegistriesModal from '@/pages/UserPreferences/ContainerRegistriesTab/Modals/DeleteRegistriesModal';
import { RegistryEntry } from '@/store/DockerConfig/types';

describe('Delete Registries Modal', () => {
  const mockOnDelete = jest.fn();
  const mockOnCancel = jest.fn();

  function getComponent(
    isDeleteModalOpen: boolean,
    selectedItems: string[],
    currentRegistry?: RegistryEntry,
  ): React.ReactElement {
    return (
      <DeleteRegistriesModal
        selectedItems={selectedItems}
        onCancel={mockOnCancel}
        onDelete={mockOnDelete}
        isOpen={isDeleteModalOpen}
        registry={currentRegistry}
      />
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render the closed modal component', () => {
    const component = getComponent(false, []);

    const json = renderer.create(component).toJSON();

    expect(json).toMatchSnapshot();
  });

  it('should correctly render the component', () => {
    const registry = new FakeRegistryBuilder()
      .withUrl('http://test.reg')
      .withPassword('tst')
      .build();
    const component = getComponent(true, [], registry);
    render(component);

    const label = screen.queryByText("Would you like to delete registry 'http://test.reg'?");
    expect(label).toBeTruthy();

    const checkbox = screen.queryByTestId('warning-info-checkbox');
    expect(checkbox).toBeTruthy();

    const deleteButton = screen.queryByTestId('delete-button');
    expect(deleteButton).toBeTruthy();

    const cancelButton = screen.queryByTestId('cancel-button');
    expect(cancelButton).toBeTruthy();
  });

  it('should correctly render the component with one selected registry', () => {
    const component = getComponent(true, ['http://testreg.com']);
    render(component);

    const label = screen.queryByText("Would you like to delete registry 'http://testreg.com'?");
    expect(label).toBeTruthy();
  });

  it('should correctly render the component with two selected registries', () => {
    const component = getComponent(true, ['http://test.reg', 'http://testreg.com']);
    render(component);

    const label = screen.queryByText('Would you like to delete 2 registries?');
    expect(label).toBeTruthy();
  });

  it('should fire onDelete the target registry event', () => {
    const registry = new FakeRegistryBuilder()
      .withUrl('http://test.reg')
      .withPassword('tst')
      .build();
    const component = getComponent(true, [], registry);
    render(component);

    const deleteButton = screen.getByTestId('delete-button');
    expect(deleteButton).toBeDisabled();

    const checkbox = screen.getByTestId('warning-info-checkbox');
    userEvent.click(checkbox);
    expect(deleteButton).toBeEnabled();

    userEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith(registry);
  });

  it('should fire onDelete registries event', () => {
    const component = getComponent(true, ['http://test.reg', 'http://testreg.com']);
    render(component);

    const deleteButton = screen.getByTestId('delete-button');
    expect(deleteButton).toBeDisabled();

    const checkbox = screen.getByTestId('warning-info-checkbox');
    userEvent.click(checkbox);
    expect(deleteButton).toBeEnabled();

    userEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith(undefined);
  });

  it('should fire onCancel event', () => {
    const component = getComponent(true, ['http://test.reg', 'http://testreg.com']);
    render(component);

    const deleteButton = screen.getByTestId('delete-button');
    expect(deleteButton).toBeDisabled();

    const cancelButton = screen.getByTestId('cancel-button');
    userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
