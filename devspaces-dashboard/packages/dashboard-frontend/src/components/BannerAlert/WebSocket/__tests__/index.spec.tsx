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
import { container } from '../../../../inversify.config';
import BannerAlertWebSocket from '..';
import { CheWorkspaceClient } from '../../../../services/workspace-client/cheworkspace/cheWorkspaceClient';
import { Provider } from 'react-redux';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import { BrandingData } from '../../../../services/bootstrap/branding.constant';
import { render, RenderResult } from '@testing-library/react';

const failingWebSocketName = 'Failing websocket';
const failingMessage = 'WebSocket connections are failing';

class mockCheWorkspaceClient extends CheWorkspaceClient {
  get failingWebSockets() {
    return [failingWebSocketName];
  }
}

const store = new FakeStoreBuilder()
  .withBranding({
    docs: {
      webSocketTroubleshooting: 'http://sample_documentation',
    },
  } as BrandingData)
  .build();

describe('BannerAlertWebSocket component', () => {
  it('should show error message when error found before mounting', () => {
    container.rebind(CheWorkspaceClient).to(mockCheWorkspaceClient).inSingletonScope();
    const component = renderComponent(<BannerAlertWebSocket />);
    container.rebind(CheWorkspaceClient).to(CheWorkspaceClient).inSingletonScope();
    expect(
      component.getAllByText(failingMessage, {
        exact: false,
      }).length,
    ).toEqual(1);
  });

  it('should show error message when error found after mounting', () => {
    const comp = (
      <Provider store={store}>
        <BannerAlertWebSocket />
      </Provider>
    );
    const component = renderComponent(comp);
    expect(
      component.queryAllByText(failingMessage, {
        exact: false,
      }),
    ).toEqual([]);
    container.rebind(CheWorkspaceClient).to(mockCheWorkspaceClient).inSingletonScope();
    component.rerender(comp);
    container.rebind(CheWorkspaceClient).to(CheWorkspaceClient).inSingletonScope();
    expect(
      component.getAllByText(failingMessage, {
        exact: false,
      }).length,
    ).toEqual(1);
  });

  it('should not show error message if none is present', () => {
    const component = renderComponent(<BannerAlertWebSocket />);
    expect(
      component.queryAllByText(failingMessage, {
        exact: false,
      }),
    ).toEqual([]);
  });
});

function renderComponent(component: React.ReactElement): RenderResult {
  return render(<Provider store={store}>{component}</Provider>);
}
