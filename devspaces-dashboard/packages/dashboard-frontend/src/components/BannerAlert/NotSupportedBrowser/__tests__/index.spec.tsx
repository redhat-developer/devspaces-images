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

import BannerAlertNotSupportedBrowser from '..';

const mockIsSupportedBrowser = jest.fn();
jest.mock('../isSupportedBrowser', () => ({
  isSupportedBrowser: () => mockIsSupportedBrowser(),
}));

const unsupportedBrowserMessage = 'The browser you are using is not supported.';

describe('BannerAlertNotSupportedBrowser component', () => {
  it('should not show error message', () => {
    mockIsSupportedBrowser.mockReturnValue(true);
    render(<BannerAlertNotSupportedBrowser />);

    expect(
      screen.queryByText(unsupportedBrowserMessage, {
        exact: false,
      }),
    ).toBeFalsy();
  });

  it('should show error message', () => {
    mockIsSupportedBrowser.mockReturnValue(false);
    render(<BannerAlertNotSupportedBrowser />);

    expect(
      screen.queryByText(unsupportedBrowserMessage, {
        exact: false,
      }),
    ).toBeTruthy();
  });
});
