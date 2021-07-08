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
import renderer from 'react-test-renderer';
import { fireEvent, render, screen } from '@testing-library/react';
import Header from '..';

jest.mock(
  '../Tools',
  () =>
    (props: {
      logout: () => void,
      changeTheme: () => void
    }) => <React.Fragment>
        <button onClick={() => props.logout()}>logout</button>
        <button onClick={() => props.changeTheme()}>change theme</button>
      </React.Fragment>
);

describe('Page header', () => {

  const mockLogout = jest.fn();
  const mockToggleNav = jest.fn();
  const mockChangeTheme = jest.fn();

  const user = {
    email: 'johndoe@example.com',
    name: 'John Doe',
  } as che.User;
  const logoUrl = 'branding/logo';
  const isHeaderVisible = true;
  const history = createHashHistory();

  const component = (<Header
    history={history}
    isVisible={isHeaderVisible}
    logoUrl={logoUrl}
    user={user}
    logout={mockLogout}
    toggleNav={mockToggleNav}
    changeTheme={mockChangeTheme}
  />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render the component', () => {
    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should fire logout event', () => {
    render(component);

    const logoutButton = screen.getByRole('button', { name: 'logout' });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should fire changeTheme event', () => {
    render(component);

    const changeThemeButton = screen.getByRole('button', { name: 'change theme' });
    fireEvent.click(changeThemeButton);

    expect(mockChangeTheme).toHaveBeenCalled();
  });

});
