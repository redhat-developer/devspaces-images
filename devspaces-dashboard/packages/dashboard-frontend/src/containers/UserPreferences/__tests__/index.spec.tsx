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

import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import UserPreferencesContainer from '@/containers/UserPreferences';
import { ROUTE } from '@/Routes';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const { renderComponent } = getComponentRenderer(getComponent);

jest.mock('@/pages/UserPreferences');

describe('UserPreferencesContainer', () => {
  test('should render UserPreferences page', () => {
    renderComponent();

    expect(screen.queryByText('User Preferences page')).toBeInTheDocument();
  });
});

function getComponent(): React.ReactElement {
  const store = new FakeStoreBuilder().build();
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={[ROUTE.USER_PREFERENCES]}>
        <Routes>
          <Route path={ROUTE.USER_PREFERENCES} element={<UserPreferencesContainer />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}
