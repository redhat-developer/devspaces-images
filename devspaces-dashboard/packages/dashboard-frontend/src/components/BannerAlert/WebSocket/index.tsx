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

import { Banner } from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { container } from '../../../inversify.config';
import { CheWorkspaceClient } from '../../../services/workspace-client/cheworkspace/cheWorkspaceClient';
import { AppState } from '../../../store';
import { selectBranding } from '../../../store/Branding/selectors';
import { DevWorkspaceClient } from '../../../services/workspace-client/devworkspace/devWorkspaceClient';

type Props = MappedProps;

type State = {
  erroringWebSockets: string[];
};

class BannerAlertWebSocket extends React.PureComponent<Props, State> {
  private readonly cheWorkspaceClient: CheWorkspaceClient;
  private readonly devWorkspaceClient: DevWorkspaceClient;

  constructor(props: Props) {
    super(props);
    this.cheWorkspaceClient = container.get(CheWorkspaceClient);
    this.devWorkspaceClient = container.get(DevWorkspaceClient);
    this.state = {
      erroringWebSockets: [
        ...this.cheWorkspaceClient.failingWebSockets,
        ...this.devWorkspaceClient.failingWebSockets,
      ],
    };
  }

  public componentWillUnmount() {
    this.cheWorkspaceClient.removeWebSocketFailedListener();
    this.devWorkspaceClient.removeWebSocketFailedListener();
  }

  public componentDidMount() {
    this.cheWorkspaceClient.onWebSocketFailed(() => {
      this.setState({
        erroringWebSockets: this.cheWorkspaceClient.failingWebSockets,
      });
    });
    this.devWorkspaceClient.onWebSocketFailed(() => {
      this.setState({
        erroringWebSockets: this.devWorkspaceClient.failingWebSockets,
      });
    });
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
