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
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import renderer from 'react-test-renderer';
import { Store } from 'redux';
import { UserAccount } from '..';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { BrandingData } from '../../../services/bootstrap/branding.constant';
import { selectBranding } from '../../../store/Branding/selectors';
import { selectUserProfile } from '../../../store/UserProfile/selectors';

describe('UserAccount page', () => {

  const history = createHashHistory();

  const getComponent = (store: Store): React.ReactElement => {
    const state = store.getState();
    const branding = selectBranding(state);
    const userProfile = selectUserProfile(state);

    return (
      <Provider store={store}>
        <UserAccount
          history={history}
          branding={branding}
          userProfile={userProfile}
          dispatch={jest.fn()}
        />
      </Provider>
    );
  };

  it('should correctly render the component without profile data', () => {
    const store = new FakeStoreBuilder().withBranding({
      name: 'test',
    } as BrandingData).build();
    const component = getComponent(store);
    render(component);

    const editAccountButton = screen.queryByLabelText('edit account info');
    expect(editAccountButton).toBeTruthy();
    expect(editAccountButton).toBeDisabled();

    const json = renderer.create(component).toJSON();

    expect(json).toMatchSnapshot();
  });

  it('should correctly render the component which contains profile data', () => {
    const store = new FakeStoreBuilder()
      .withBranding({
        name: 'Product name'
      } as BrandingData)
      .withUserProfile({
        attributes: {
          firstName: 'John',
          lastName: 'Doe',
          preferred_username: 'Johnny',
        },
        email: 'johndoe@test.com',
        userId: 'john-doe-id',
      })
      .build();
    const component = getComponent(store);
    render(component);

    const editAccountButton = screen.getByLabelText('edit account info');
    expect(editAccountButton).toBeDisabled();

    const json = renderer.create(component).toJSON();

    expect(json).toMatchSnapshot();
  });

});
