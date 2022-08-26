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
import { connect, ConnectedProps } from 'react-redux';
import * as WorkspaceStore from '../../../store/Workspaces';
import { LoaderStep } from '../../../components/Loader/Step';
import { AlertItem, LoaderTab } from '../../../services/helpers/types';
import { ActionCallback } from '../../../components/Loader/Alert';
import { Workspace, WorkspaceAdapter } from '../../../services/workspace-adapter';

import { CommonLoaderPage } from '../Common';
import { AppState } from '../../../store';
import { buildIdeLoaderLocation } from '../../../services/helpers/location';
import { selectAllDevWorkspaces } from '../../../store/Workspaces/devWorkspaces/selectors';
import { RunningWorkspacesExceededError } from '../../../store/Workspaces/devWorkspaces';
import { lazyInject } from '../../../inversify.config';
import { AppAlerts } from '../../../services/alerts/appAlerts';
import { AlertVariant } from '@patternfly/react-core';
import getRandomString from '../../../services/helpers/random';
import common from '@eclipse-che/common';

export type Props = MappedProps & {
  alertItem: AlertItem | undefined;
  currentStepId: number;
  steps: LoaderStep[];
  tabParam: string | undefined;
  workspace: Workspace | undefined;
  onRestart: () => void;
};
export type State = {
  activeTabKey: LoaderTab;
  isPopupAlertVisible: boolean;
};

class WorkspaceLoaderPage extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    const { tabParam } = this.props;
    const activeTabKey = tabParam && LoaderTab[tabParam] ? LoaderTab[tabParam] : LoaderTab.Progress;

    this.state = {
      activeTabKey,
      isPopupAlertVisible: false,
    };
  }

  private handleRestart(verbose: boolean): void {
    this.setState({
      activeTabKey: verbose ? LoaderTab.Logs : LoaderTab.Progress,
    });
    this.props.onRestart();
  }

  private handleTabChange(tabKey: LoaderTab): void {
    this.setState({
      activeTabKey: tabKey,
    });
  }

  private getActionCallbacks(): ActionCallback[] {
    if (this.props.alertItem?.error instanceof RunningWorkspacesExceededError) {
      const runningWorkspaces = this.props.allWorkspaces.filter(
        workspace => workspace.spec.started,
      );
      if (runningWorkspaces.length > 1) {
        return [
          {
            title: `Return to dashboard`,
            callback: () => {
              window.location.href = window.location.origin + '/dashboard/';
            },
          },
        ];
      }
      if (runningWorkspaces.length === 1) {
        const runningWorkspace = new WorkspaceAdapter(runningWorkspaces[0]);
        return [
          {
            title: `Close running workspace (${runningWorkspace.name}) and restart ${this.props.workspace?.name}`,
            callback: () => {
              this.props
                .stopWorkspace(runningWorkspace)
                .then(() => {
                  this.handleRestart(false);
                })
                .catch(err => {
                  this.appAlerts.showAlert({
                    key: 'workspace-loader-page-' + getRandomString(4),
                    title: common.helpers.errors.getMessage(err),
                    variant: AlertVariant.danger,
                  });
                });
            },
          },
          {
            title: `Switch to running workspace (${runningWorkspace.name}) to save any changes`,
            callback: () => {
              const ideLoader = buildIdeLoaderLocation(runningWorkspace);
              const url = window.location.href.split('#')[0];
              window.open(`${url}#${ideLoader.pathname}`, runningWorkspace.uid);
            },
          },
        ];
      }
    }

    return [
      {
        title: 'Restart',
        callback: () => this.handleRestart(false),
      },
      {
        title: 'Open in Verbose mode',
        callback: () => this.handleRestart(true),
      },
    ];
  }

  render(): React.ReactNode {
    const { alertItem, currentStepId, steps, workspace } = this.props;
    const { activeTabKey } = this.state;

    return (
      <CommonLoaderPage
        actionCallbacks={this.getActionCallbacks()}
        activeTabKey={activeTabKey}
        alertItem={alertItem}
        currentStepId={currentStepId}
        steps={steps}
        workspace={workspace}
        onTabChange={tabKey => this.handleTabChange(tabKey)}
      />
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllDevWorkspaces(state),
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators);
type MappedProps = ConnectedProps<typeof connector>;
export default connector(WorkspaceLoaderPage);
