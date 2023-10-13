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

import { Banner } from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { container } from '@/inversify.config';
import {
  ConnectionEvent,
  ConnectionListener,
  WebsocketClient,
} from '@/services/backend-client/websocketClient';
import { AppState } from '@/store';
import { selectBranding } from '@/store/Branding/selectors';

type Props = MappedProps;

type State = {
  erroringWebSockets: string[];
};

class BannerAlertWebSocket extends React.PureComponent<Props, State> {
  private readonly websocketClient: WebsocketClient;
  private readonly onDidWebsocketFail: ConnectionListener;
  private readonly onDidWebsocketOpen: ConnectionListener;

  constructor(props: Props) {
    super(props);
    this.websocketClient = container.get(WebsocketClient);
    this.state = {
      erroringWebSockets: [],
    };
    this.onDidWebsocketFail = () => {
      this.setState({
        erroringWebSockets: [this.websocketClient.websocketContext],
      });
    };
    this.onDidWebsocketOpen = () => {
      this.setState({
        erroringWebSockets: [],
      });
    };
  }

  public componentWillUnmount() {
    this.websocketClient.removeConnectionEventListener(
      ConnectionEvent.ERROR,
      this.onDidWebsocketFail,
    );
    this.websocketClient.removeConnectionEventListener(
      ConnectionEvent.OPEN,
      this.onDidWebsocketOpen,
    );
  }

  public componentDidMount() {
    this.websocketClient.addConnectionEventListener(
      ConnectionEvent.ERROR,
      this.onDidWebsocketFail,
      true,
    );
    this.websocketClient.addConnectionEventListener(ConnectionEvent.OPEN, this.onDidWebsocketOpen);
  }

  render() {
    if (this.state.erroringWebSockets.length === 0) {
      return null;
    }

    const webSocketTroubleshootingDocs = this.props.branding.docs.webSocketTroubleshooting;
    return (
      <Banner className="pf-u-text-align-center" variant="warning">
        WebSocket connections are failing. Refer to &quot;
        <a href={webSocketTroubleshootingDocs} rel="noreferrer" target="_blank">
          Network Troubleshooting
        </a>
        &quot; in the user guide.
      </Banner>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  branding: selectBranding(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(BannerAlertWebSocket);
