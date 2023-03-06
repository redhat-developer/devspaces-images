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
import { List, LoaderStep, LoadingStep } from '../../../components/Loader/Step';
import { WorkspaceParams } from '../../../Routes/routes';
import StepCheckRunningWorkspacesLimit from '../CommonSteps/CheckRunningWorkspacesLimit';
import StepApplyDevfile from './Steps/Apply/Devfile';
import StepApplyResources from './Steps/Apply/Resources';
import StepCheckExistingWorkspaces from './Steps/CheckExistingWorkspaces';
import StepCreateWorkspace from './Steps/CreateWorkspace';
import StepFetchDevfile from './Steps/Fetch/Devfile';
import StepFetchResources from './Steps/Fetch/Resources';
import StepInitialize from './Steps/Initialize';

export type Props = {
  currentStepIndex: number;
  history: History;
  loaderSteps: Readonly<List<LoaderStep>>;
  searchParams: URLSearchParams;
  matchParams: WorkspaceParams | undefined;
  tabParam: string | undefined;
  onNextStep: () => void;
  onRestart: (tabName?: string) => void;
  onTabChange: (tab: string) => void;
};

export default class FactoryLoader extends React.Component<Props> {
  private handleWorkspaceRestart(tabName?: string): void {
    this.props.onRestart(tabName);
  }

  render(): React.ReactElement {
    const { currentStepIndex, loaderSteps } = this.props;

    switch (loaderSteps.get(currentStepIndex).value.id) {
      case LoadingStep.CHECK_RUNNING_WORKSPACES_LIMIT:
        return (
          <StepCheckRunningWorkspacesLimit
            {...this.props}
            onRestart={tabName => this.handleWorkspaceRestart(tabName)}
          />
        );
      case LoadingStep.CREATE_WORKSPACE:
        return <StepCreateWorkspace {...this.props} />;
      case LoadingStep.CREATE_WORKSPACE__FETCH_DEVFILE:
        return <StepFetchDevfile {...this.props} />;
      case LoadingStep.CREATE_WORKSPACE__FETCH_RESOURCES:
        return <StepFetchResources {...this.props} />;
      case LoadingStep.CREATE_WORKSPACE__CHECK_EXISTING_WORKSPACES:
        return <StepCheckExistingWorkspaces {...this.props} />;
      case LoadingStep.CREATE_WORKSPACE__APPLY_DEVFILE:
        return <StepApplyDevfile {...this.props} />;
      case LoadingStep.CREATE_WORKSPACE__APPLY_RESOURCES:
        return <StepApplyResources {...this.props} />;
      default:
        return <StepInitialize {...this.props} />;
    }
  }
}
