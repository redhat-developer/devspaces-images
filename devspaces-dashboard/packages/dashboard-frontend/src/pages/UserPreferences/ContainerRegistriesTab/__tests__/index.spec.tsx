/*
 * Copyright (c) 2018-2023 Red Hat, Inc.
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
import { Provider } from 'react-redux';
import renderer from 'react-test-renderer';
import { Store } from 'redux';

import { FakeRegistryBuilder } from '@/pages/UserPreferences/ContainerRegistriesTab/__tests__/__mocks__/registryRowBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { selectIsLoading, selectRegistries } from '@/store/DockerConfig/selectors';

import { ContainerRegistries } from '..';

describe('ContainerRegistries', () => {
  const mockRequestCredentials = jest.fn();
  const mockUpdateCredentials = jest.fn();

  const getComponent = (store: Store): React.ReactElement => {
    const state = store.getState();
    const registries = selectRegistries(state);
    const isLoading = selectIsLoading(state);
    return (
      <Provider store={store}>
        <ContainerRegistries
          registries={registries}
          isLoading={isLoading}
          requestCredentials={mockRequestCredentials}
          updateCredentials={mockUpdateCredentials}
        />
      </Provider>
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render the component without registries', () => {
    const component = getComponent(new FakeStoreBuilder().build());
    render(component);

    const addRegistryButton = screen.queryByLabelText('add-registry');
    expect(addRegistryButton).toBeTruthy();

    const json = renderer.create(component).toJSON();

    expect(json).toMatchSnapshot();
  });

  it('should correctly render the component which contains two registries', () => {
    const component = getComponent(
      new FakeStoreBuilder()
        .withDockerConfig([
          new FakeRegistryBuilder().withUrl('http://test.reg').withPassword('qwerty').build(),
          new FakeRegistryBuilder().withUrl('https://tstreg.com').withPassword('123').build(),
        ])
        .build(),
    );
    render(component);

    const addRegistryButton = screen.queryByTestId('add-button');
    expect(addRegistryButton).toBeTruthy();

    const json = renderer.create(component).toJSON();

    expect(json).toMatchSnapshot();
  });

  it('should add a new registry', () => {
    const component = getComponent(new FakeStoreBuilder().build());
    render(component);

    const addRegistryButton = screen.getByLabelText('add-registry');
    userEvent.click(addRegistryButton);

    const editButton = screen.getByTestId('edit-button');
    expect(editButton).toBeDisabled();

    const urlInput = screen.getByLabelText('Url input');
    userEvent.type(urlInput, 'http://tst');

    const passwordInput = screen.getByTestId('registry-password-input');
    userEvent.type(passwordInput, 'qwe');

    expect(editButton).toBeEnabled();

    userEvent.click(editButton);
    expect(mockUpdateCredentials).toBeCalledWith([
      {
        url: 'http://tst',
        username: '',
        password: 'qwe',
      },
    ]);
  });

  it('should delete a registry', () => {
    const component = getComponent(
      new FakeStoreBuilder()
        .withDockerConfig([
          new FakeRegistryBuilder().withUrl('http://test.reg').withPassword('qwerty').build(),
        ])
        .build(),
    );
    render(component);

    const menuButton = screen.getByLabelText('Actions');
    userEvent.click(menuButton);

    const deleteItem = screen.getByRole('menuitem', { name: /Delete registry/i });
    userEvent.click(deleteItem);

    const label = screen.queryByText("Would you like to delete registry 'http://test.reg'?");
    expect(label).toBeTruthy();

    const deleteButton = screen.getByTestId('delete-button');
    expect(deleteButton).toBeDisabled();

    const checkbox = screen.getByTestId('warning-info-checkbox');
    userEvent.click(checkbox);
    expect(deleteButton).toBeEnabled();

    userEvent.click(deleteButton);
    expect(mockUpdateCredentials).toBeCalledWith([]);
  });
});
