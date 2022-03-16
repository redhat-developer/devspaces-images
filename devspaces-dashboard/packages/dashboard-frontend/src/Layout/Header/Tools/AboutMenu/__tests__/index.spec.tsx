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

import React from 'react';
import { Provider } from 'react-redux';
import renderer from 'react-test-renderer';
import { fireEvent, render, screen } from '@testing-library/react';
import { Action, Store } from 'redux';
import { AboutMenu } from '..';
import { AppThunk } from '../../../../../store';
import { FakeStoreBuilder } from '../../../../../store/__mocks__/storeBuilder';
import {
  BrandingData,
  BRANDING_DEFAULT,
} from '../../../../../services/bootstrap/branding.constant';
import * as InfrastructureNamespacesStore from '../../../../../store/InfrastructureNamespaces';
import { selectBranding } from '../../../../../store/Branding/selectors';
import { selectUserProfile } from '../../../../../store/UserProfile/selectors';

jest.mock('gravatar-url', () => {
  return function () {
    return 'avatar/source/location';
  };
});

jest.mock('../../../../../store/InfrastructureNamespaces', () => {
  return {
    actionCreators: {
      requestNamespaces:
        (): AppThunk<Action, Promise<che.KubernetesNamespace[]>> =>
        async (): Promise<che.KubernetesNamespace[]> => {
          return Promise.resolve([]);
        },
    } as InfrastructureNamespacesStore.ActionCreators,
  };
});

describe('About Menu', () => {
  global.open = jest.fn();

  const productCli = 'crwctl';
  const email = 'johndoe@example.com';
  const name = 'John Doe';
  const store = createStore(productCli, name, email);
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
      <AboutMenu branding={branding} user={user} userProfile={userProfile} />
    </Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render the component', () => {
    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should open the About Menu', () => {
    render(component);

    const aboutMenuButton = screen.getByRole('button', { name: 'About Menu' });
    fireEvent.click(aboutMenuButton);

    const items = screen.getAllByRole('menuitem');
    expect(items.length).toEqual(4);
  });

  it('should open page to make a wish', () => {
    render(component);

    const aboutMenuButton = screen.getByRole('button', { name: 'About Menu' });
    fireEvent.click(aboutMenuButton);

    const makeAWishItem = screen.getByRole('menuitem', { name: /Make a wish/i });
    fireEvent.click(makeAWishItem);

    expect(global.open).toHaveBeenCalledWith('mailto:che-dev@eclipse.org', '_blank');
  });

  it('should open page with the documentation url', () => {
    render(component);

    const aboutMenuButton = screen.getByRole('button', { name: 'About Menu' });
    fireEvent.click(aboutMenuButton);

    const documentationItem = screen.getByRole('menuitem', { name: /Documentation/i });
    fireEvent.click(documentationItem);

    expect(global.open).toHaveBeenCalledWith('https://www.eclipse.org/che/docs/che-7', '_blank');
  });

  it('should open page with the community url', () => {
    render(component);

    const aboutMenuButton = screen.getByRole('button', { name: 'About Menu' });
    fireEvent.click(aboutMenuButton);

    const helpItem = screen.getByRole('menuitem', { name: new RegExp('Community', 'i') });
    fireEvent.click(helpItem);

    expect(global.open).toHaveBeenCalledWith('https://www.eclipse.org/che/', '_blank');
  });

  it('should fire the about dropdown event', () => {
    render(component);

    const aboutMenuButton = screen.getByRole('button', { name: 'About Menu' });
    fireEvent.click(aboutMenuButton);

    const aboutItem = screen.getByRole('menuitem', { name: /About/i });
    fireEvent.click(aboutItem);

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
  });
});

function createStore(cheCliTool: string, name: string, email: string): Store {
  return new FakeStoreBuilder()
    .withUserProfile({
      attributes: {
        preferred_username: name,
      },
      email,
    } as api.che.user.Profile)
    .withBranding({
      configuration: {
        cheCliTool,
      },
      links: BRANDING_DEFAULT.links,
      docs: {},
    } as BrandingData)
    .build();
}
