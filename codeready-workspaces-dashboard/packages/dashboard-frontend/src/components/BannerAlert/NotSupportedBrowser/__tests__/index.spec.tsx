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
import { render, screen } from '@testing-library/react';
import BannerAlertNotSupportedBrowser from '..';
import { isSafari } from '../../../../services/helpers/detectBrowser';

const unsupportedBrowserMessage = 'The browser you are using is not supported.';

describe('BannerAlertNotSupportedBrowser component', () => {
  it('should not show error message', () => {
    render(<BannerAlertNotSupportedBrowser />);
    expect(
      screen.queryByText(unsupportedBrowserMessage, {
        exact: false,
      }),
    ).toBeFalsy();
  });

  it('should show error message when error found after mounting', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (isSafari as any) = true;
    render(<BannerAlertNotSupportedBrowser />);

    expect(
      screen.queryByText(unsupportedBrowserMessage, {
        exact: false,
      }),
    ).toBeTruthy();
  });
});
