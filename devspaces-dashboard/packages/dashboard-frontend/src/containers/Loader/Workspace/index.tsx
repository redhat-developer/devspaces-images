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
import { connect, ConnectedProps } from 'react-redux';
import { History } from 'history';
import { AppState } from '../../../store';
import { selectAllWorkspaces } from '../../../store/Workspaces/selectors';
import * as WorkspaceStore from '../../../store/Workspaces';
import { List, LoaderStep, LoadingStep } from '../../../components/Loader/Step';
import StepInitialize from './Steps/Initialize';
import StepStartWorkspace from './Steps/StartWorkspace';
import StepOpenWorkspace from './Steps/OpenWorkspace';
import StepCheckRunningWorkspacesLimit from './Steps/CheckRunningWorkspacesLimit';

export type Props = MappedProps & {
  currentStepIndex: number; // not ID, but index
  history: History;
  loaderSteps: Readonly<List<LoaderStep>>;
  matchParams: {
    namespace: string;
    workspaceName: string;
  };
  tabParam: string | undefined;
  onNextStep: () => void;
  onRestart: (tabName?: string) => void;
  onTabChange: (tab: string) => void;
};

class WorkspaceLoader extends React.PureComponent<Props> {
  constructor(props: Props) {
    super(props);
  }

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
