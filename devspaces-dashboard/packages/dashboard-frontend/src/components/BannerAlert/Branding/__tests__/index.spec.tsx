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

import React from 'react';
import BannerAlertBranding from '..';
import { Provider } from 'react-redux';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import { BrandingData } from '../../../../services/bootstrap/branding.constant';
import { render, RenderResult } from '@testing-library/react';
import { Store } from 'redux';

const scheduledMaintenance = 'Scheduled maintenance.';

describe('BannerAlertBranding component', () => {
  it('should show header warning message when warning option is set', () => {
    const component = renderComponent(<BannerAlertBranding />, storeBuilder(scheduledMaintenance));
    expect(
      component.queryAllByText(scheduledMaintenance, {
        exact: false,
      }).length,
    ).toEqual(1);
  });

  it('should not show header warning message when no warning option is present', () => {
    const component = renderComponent(<BannerAlertBranding />, new FakeStoreBuilder().build());
    expect(
      component.queryAllByText(scheduledMaintenance, {
        exact: false,
      }),
    ).toEqual([]);
  });

  it('warning message is sanitized', () => {
    const sanitizingMessage = 'Scheduled maintenance. <a href="foo">foo</a> has more <b>info</b>';
    const sanitizedMessage = 'Scheduled maintenance. <a href="foo">foo</a> has more info';
    const component = renderComponent(<BannerAlertBranding />, storeBuilder(sanitizingMessage));
    const elements = component.queryAllByText(scheduledMaintenance, {
      exact: false,
    });
    expect(elements.length).toEqual(1);
    expect(elements[0].innerHTML).toEqual(sanitizedMessage);
  });
});

function renderComponent(component: React.ReactElement, store: Store<any, any>): RenderResult {
  return render(<Provider store={store}>{component}</Provider>);
}

function storeBuilder(message: string): Store {
  return new FakeStoreBuilder()
    .withBranding({
      header: {
        warning: message,
      },
    } as BrandingData)
    .build();
}
