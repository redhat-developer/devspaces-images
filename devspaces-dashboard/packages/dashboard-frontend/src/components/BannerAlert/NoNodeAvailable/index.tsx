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

import { Banner } from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { container } from '@/inversify.config';
import { WebsocketClient } from '@/services/backend-client/websocketClient';
import { DevWorkspaceStatus } from '@/services/helpers/types';
import { AppState } from '@/store';
import { selectAllEvents } from '@/store/Events/selectors';
import { selectAllWorkspaces } from '@/store/Workspaces/selectors';

type Props = MappedProps;

type State = {
  startingWorkspaces: string[];
};

class BannerAlertNoNodeAvailable extends React.PureComponent<Props, State> {
  private readonly websocketClient: WebsocketClient;

  constructor(props: Props) {
    super(props);
    this.websocketClient = container.get(WebsocketClient);
    this.state = {
      startingWorkspaces: [],
    };
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    this.handleAllEventsChange(prevProps);
    this.handleAllWorkspacesChange(prevProps);
  }

  private handleAllEventsChange(prevProps: Readonly<Props>) {
    const allEvents = this.props.allEvents;
    const prevAllEvents = prevProps.allEvents;

    if (JSON.stringify(allEvents) === JSON.stringify(prevAllEvents)) {
      return;
    }

    const event = allEvents[allEvents.length - 1];
    if (
      event.message !== undefined &&
      event.reason === 'FailedScheduling' &&
      event.message.indexOf('No preemption victims found for incoming pod') > -1 &&
      this.state.startingWorkspaces.length === 0
    ) {
      this.setState({ startingWorkspaces: [event.metadata!.uid!] });
    }
  }

  private handleAllWorkspacesChange(prevProps: Readonly<Props>) {
    const prevAllWorkspaces = prevProps.allWorkspaces;
    const allWorkspaces = this.props.allWorkspaces;

    if (JSON.stringify(allWorkspaces) === JSON.stringify(prevAllWorkspaces)) {
      return;
    }

    if (
      allWorkspaces.some(
        workspace =>
          workspace.status === DevWorkspaceStatus.RUNNING &&
          prevAllWorkspaces.find(
            prevWorkspace =>
              prevWorkspace.id === workspace.id &&
              prevWorkspace.status === DevWorkspaceStatus.STARTING,
          ),
      )
    ) {
      this.setState({ startingWorkspaces: [] });
    }
  }

  render() {
    if (this.state.startingWorkspaces.length === 0) {
      return null;
    }

    return (
      <Banner className="pf-u-text-align-center" variant="warning">
        &quot;FailedScheduling&quot; event occurred. If cluster autoscaler is enabled it might be
        provisioning a new node now and workspace startup will take longer than usual.
      </Banner>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allEvents: selectAllEvents(state),
  allWorkspaces: selectAllWorkspaces(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(BannerAlertNoNodeAvailable);
