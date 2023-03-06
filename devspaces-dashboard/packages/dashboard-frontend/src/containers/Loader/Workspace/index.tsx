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

import { History } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { List, LoaderStep, LoadingStep } from '../../../components/Loader/Step';
import { WorkspaceParams } from '../../../Routes/routes';
import { AppState } from '../../../store';
import * as WorkspaceStore from '../../../store/Workspaces';
import { selectAllWorkspaces } from '../../../store/Workspaces/selectors';
import StepCheckRunningWorkspacesLimit from '../CommonSteps/CheckRunningWorkspacesLimit';
import StepInitialize from './Steps/Initialize';
import StepOpenWorkspace from './Steps/OpenWorkspace';
import StepStartWorkspace from './Steps/StartWorkspace';

export type Props = MappedProps & {
  currentStepIndex: number; // not ID, but index
  history: History;
  loaderSteps: Readonly<List<LoaderStep>>;
  matchParams: WorkspaceParams;
  tabParam: string | undefined;
  onNextStep: () => void;
  onRestart: (tabName?: string) => void;
  onTabChange: (tab: string) => void;
};

class WorkspaceLoader extends React.PureComponent<Props> {
  private handleWorkspaceRestart(tabName?: string): void {
    this.props.onRestart(tabName);
  }

  render(): React.ReactNode {
    const { currentStepIndex, loaderSteps } = this.props;

    switch (loaderSteps.get(currentStepIndex).value.id) {
      case LoadingStep.INITIALIZE:
        return (
          <StepInitialize
            {...this.props}
            onRestart={tabName => this.handleWorkspaceRestart(tabName)}
          />
        );
      case LoadingStep.CHECK_RUNNING_WORKSPACES_LIMIT:
        return (
          <StepCheckRunningWorkspacesLimit
            {...this.props}
            onRestart={tabName => this.handleWorkspaceRestart(tabName)}
          />
        );
      case LoadingStep.START_WORKSPACE:
        return (
          <StepStartWorkspace
            {...this.props}
            onRestart={tabName => this.handleWorkspaceRestart(tabName)}
          />
        );
      default:
        return (
          <StepOpenWorkspace
            {...this.props}
            onRestart={tabName => this.handleWorkspaceRestart(tabName)}
          />
        );
    }
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators);
type MappedProps = ConnectedProps<typeof connector>;
export default connector(WorkspaceLoader);
