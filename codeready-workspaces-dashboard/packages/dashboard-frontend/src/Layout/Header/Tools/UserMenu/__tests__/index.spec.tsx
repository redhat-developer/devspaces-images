/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { createHashHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import renderer from 'react-test-renderer';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Action, Store } from 'redux';
import UserMenu from '..';
import { AppThunk } from '../../../../../store';
import { FakeStoreBuilder } from '../../../../../store/__mocks__/storeBuilder';
import { BrandingData, BRANDING_DEFAULT } from '../../../../../services/bootstrap/branding.constant';
import * as InfrastructureNamespacesStore from '../../../../../store/InfrastructureNamespaces';
import { selectBranding } from '../../../../../store/Branding/selectors';
import { selectUserProfile } from '../../../../../store/UserProfile/selectors';

jest.mock('../../../../../store/InfrastructureNamespaces', () => {
  return {
    actionCreators: {
      requestNamespaces: (): AppThunk<Action, Promise<che.KubernetesNamespace[]>> => async (): Promise<che.KubernetesNamespace[]> => {
        return Promise.resolve([]);
      }
    } as InfrastructureNamespacesStore.ActionCreators,
  };
});

describe('User Menu', () => {
  const mockLogout = jest.fn();
  global.open = jest.fn();

  const productCli = 'crwctl';
  const email = 'johndoe@example.com';
  const name = 'John Doe';
  const store = createStore(productCli, name, email);
  const history = createHashHistory();
  const user = {
    id: 'test-id',
    name: name,
    email: email,
    links: [],
  };
  const branding = selectBranding(store.getState());
  const userProfile = selectUserProfile(store.getState());

  const component = (
    <Provider store={store}>
      <UserMenu
        branding={branding}
        history={history}
        user={user}
        userProfile={userProfile}
        logout={mockLogout}
      />
    </Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render the component', () => {
    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should open the dropdown', () => {
    render(component);

    const menuButton = screen.getByRole('button', { name });
    fireEvent.click(menuButton);

    const items = screen.getAllByRole('menuitem');
    expect(items.length).toEqual(4);
  });

  it('should fire the logout event', () => {
    render(component);

    const menuButton = screen.getByRole('button', { name });
    fireEvent.click(menuButton);

    const logoutItem = screen.getByRole('menuitem', { name: /logout/i });
    fireEvent.click(logoutItem);

    expect(mockLogout).toBeCalled();
  });

  it('should copy the login command to clipboard', async () => {
    render(component);

    const mockClipboardWriteText = jest.fn();
    (window.navigator as any).clipboard = {
      writeText: mockClipboardWriteText,
    };

    const menuButton = screen.getByRole('button', { name });
    fireEvent.click(menuButton);

    const copyLoginCommandButton = screen.getByText(`Copy ${productCli} login command`);
    fireEvent.click(copyLoginCommandButton);

    await waitFor(() => expect(mockClipboardWriteText).toHaveBeenCalledWith('crwctl auth:login localhost'));
  });

});

function createStore(cheCliTool: string, name: string, email: string): Store {
  return new FakeStoreBuilder()
    .withUserProfile({
      attributes: {
        preferred_username: name,
      },
      email
    } as api.che.user.Profile)
    .withBranding({
      configuration: {
        cheCliTool
      },
      links: BRANDING_DEFAULT.links,
      docs: {
      },
    } as BrandingData)
    .build();
}
