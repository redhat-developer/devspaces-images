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

import { Brand } from '@patternfly/react-core';
import { fireEvent, render, screen } from '@testing-library/react';
import { createHashHistory } from 'history';
import React from 'react';
import renderer from 'react-test-renderer';

import Header from '..';

jest.mock('../Tools', () => {
  const FakeTools = (props: { logout: () => void; changeTheme: () => void }) => (
    <React.Fragment>
      <button onClick={() => props.logout()}>logout</button>
    </React.Fragment>
  );
  FakeTools.displayName = 'Tools';
  return FakeTools;
});

describe('Page header', () => {
  const mockLogout = jest.fn();
  const mockToggleNav = jest.fn();

  const logo = <Brand src="branding/logo" alt="Logo" />;
  const isHeaderVisible = true;
  const history = createHashHistory();

  const component = (
    <Header
      history={history}
      isVisible={isHeaderVisible}
      logo={logo}
      logout={mockLogout}
      toggleNav={mockToggleNav}
    />
  );

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
});
