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
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import GetStartedContainer from '@/containers/GetStarted';
import { ROUTE } from '@/Routes';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

jest.mock('@/pages/GetStarted');

const { renderComponent } = getComponentRenderer(getComponent);

describe('GetStarted container', () => {
  it('should render GetStarted page', () => {
    renderComponent();

    expect(screen.getByText('Get Started page')).toBeInTheDocument();
  });
});

function getComponent() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path={ROUTE.HOME} element={<GetStartedContainer />} />
      </Routes>
    </MemoryRouter>
  );
}
