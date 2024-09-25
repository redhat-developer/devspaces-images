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

import { InitialEntry } from 'history';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ROUTE } from '@/Routes';
import { Redirects } from '@/Routes/Redirects';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { renderComponent } = getComponentRenderer(getComponent);

describe('Redirects', () => {
  it('should handle paths started with `/http://`', () => {
    const entry = '/http://example.com';
    renderComponent([entry]);

    expect(screen.getByTestId('loader-page')).toBeInTheDocument();
  });

  it('should handle paths started with `/https://`', () => {
    const entry = '/https://example.com';
    renderComponent([entry]);

    expect(screen.getByTestId('loader-page')).toBeInTheDocument();
  });

  it('should handle paths started with `/ssh://`', () => {
    const entry = '/ssh://git@example.com:user/repo';
    renderComponent([entry]);

    expect(screen.getByTestId('loader-page')).toBeInTheDocument();
  });

  it('should handle paths started with `/git@`', () => {
    const entry = '/git@example.com:user/repo';
    renderComponent([entry]);

    expect(screen.getByTestId('loader-page')).toBeInTheDocument();
  });

  it('should redirect to home page for other paths', () => {
    const entry = '/other-path';
    renderComponent([entry]);

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
});

function getComponent(initialEntries: InitialEntry[]) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        {/* test result of Redirects */}
        <Route path={ROUTE.FACTORY_LOADER} element={<div data-testid="loader-page" />} />
        <Route path={ROUTE.HOME} element={<div data-testid="home-page" />} />

        {/* <Redirects /> */}
        <Route path="*" element={<Redirects />} />
      </Routes>
    </MemoryRouter>
  );
}
