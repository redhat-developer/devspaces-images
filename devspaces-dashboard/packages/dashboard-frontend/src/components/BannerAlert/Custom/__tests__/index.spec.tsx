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

import { render, RenderResult, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

import BannerAlertCustomWarning from '..';

const issueWarning = 'Something happened.';

describe('BannerAlertCustomWarning component', () => {
  it('should not show header warning message when no warning option is present', () => {
    renderComponent(storeBuilder([]));
    expect(screen.queryByText(issueWarning)).not.toBeInTheDocument();
  });

  it('should show message when warning option is set', () => {
    renderComponent(storeBuilder([issueWarning]));
    expect(screen.queryByText(issueWarning)).toBeInTheDocument();
  });

  it('should show several messages', () => {
    renderComponent(storeBuilder([issueWarning + '#1', issueWarning + '#2', issueWarning + '#3']));
    expect(
      screen.queryAllByText(issueWarning, {
        exact: false,
      }).length,
    ).toEqual(3);
  });
});

function renderComponent(store: Store<any, any>): RenderResult {
  return render(
    <Provider store={store}>
      <BannerAlertCustomWarning />
    </Provider>,
  );
}

function storeBuilder(messages: string[]): Store {
  return new FakeStoreBuilder().withBannerAlert(messages).build();
}
