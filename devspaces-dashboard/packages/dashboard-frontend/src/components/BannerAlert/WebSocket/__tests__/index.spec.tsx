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

import { render, RenderResult } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { container } from '@/inversify.config';
import { ConnectionEvent, WebsocketClient } from '@/services/backend-client/websocketClient';
import { BrandingData } from '@/services/bootstrap/branding.constant';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

import BannerAlertWebSocket from '..';

const failingMessage = 'WebSocket connections are failing';

const store = new FakeStoreBuilder()
  .withBranding({
    docs: {
      webSocketTroubleshooting: 'http://sample_documentation',
    },
  } as BrandingData)
  .build();

describe('BannerAlertWebSocket component', () => {
  beforeEach(() => {
    container.snapshot();
  });

  afterEach(() => {
    container.restore();
  });

  it('should show error message when error found before component mounted', () => {
    // fire event before component mounted
    const websocketClient = container.get(WebsocketClient);
    (websocketClient as any).notifyConnectionEventListeners(
      ConnectionEvent.ERROR,
      'WebSocket connection error.',
    );

    // mount and render the component
    const component = renderComponent(<BannerAlertWebSocket />);

    expect(
      component.queryByText(failingMessage, {
        exact: false,
      }),
    ).toBeTruthy();
  });

  it('should show error message when error found after mounting', () => {
    const comp = (
      <Provider store={store}>
        <BannerAlertWebSocket />
      </Provider>
    );
    const component = renderComponent(comp);
    expect(
      component.queryByText(failingMessage, {
        exact: false,
      }),
    ).toBeFalsy();

    const websocketClient = container.get(WebsocketClient);
    (websocketClient as any).notifyConnectionEventListeners(
      ConnectionEvent.ERROR,
      'WebSocket connection error.',
    );
    component.rerender(comp);

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
