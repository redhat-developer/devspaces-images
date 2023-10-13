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
import React from 'react';

import { AboutModal } from '@/Layout/Header/Tools/AboutMenu/Modal';

jest.mock('detect-browser/index.js', () => {
  return {
    detect: () => {
      return {
        name: 'chrome',
        version: '1.0.0',
        os: 'linux',
        type: 'browser',
      };
    },
  };
});

describe('About modal', () => {
  const closeModal = jest.fn();
  const component = (
    <AboutModal
      productName="Che"
      serverVersion="0.0.1"
      closeModal={closeModal}
      isOpen={true}
      logo="./"
      username="test-user"
    />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // react-test-renderer doesn't have support for portal: https://github.com/facebook/react/issues/11565
  // which makes this fail
  // it('should correctly render the component', () => {
  //   expect(renderer.create(component).toJSON()).toMatchSnapshot();
  // });

  it('should display dashboard version', () => {
    (window as any).process = {
      env: {
        DASHBOARD_VERSION: '1.2.3',
      },
    };
    render(component);

    expect(screen.queryByText('Dashboard Version')).not.toBeNull();

    const description = screen.queryByTestId('dashboard-version');
    expect(description).not.toBeNull();
    expect(description).toHaveTextContent('1.2.3');
  });

  it('should display server version', () => {
    render(component);

    expect(screen.queryByText('Server Version')).not.toBeNull();

    const description = screen.queryByTestId('server-version');
    expect(description).not.toBeNull();
    expect(description).toHaveTextContent('0.0.1');
  });

  it('should display username', () => {
    render(component);

    expect(screen.queryByText('Username')).not.toBeNull();

    const description = screen.queryByTestId('username');
    expect(description).not.toBeNull();
    expect(description).toHaveTextContent('test-user');
  });

  it('should display browser version', () => {
    render(component);

    expect(screen.queryByText('Browser Version')).not.toBeNull();

    const description = screen.queryByTestId('browser-version');
    expect(description).not.toBeNull();
    expect(description).toHaveTextContent('1.0.0');
  });

  it('should display browser os', () => {
    render(component);

    expect(screen.queryByText('Browser OS')).not.toBeNull();

    const description = screen.queryByTestId('browser-os');
    expect(description).not.toBeNull();
    expect(description).toHaveTextContent('linux');
  });

  it('should display browser name', () => {
    render(component);

    expect(screen.queryByText('Browser Name')).not.toBeNull();

    const description = screen.queryByTestId('browser-name');
    expect(description).not.toBeNull();
    expect(description).toHaveTextContent('chrome');
  });
});
