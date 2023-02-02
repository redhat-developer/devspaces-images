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
import { History } from 'history';
import { List, LoaderStep, LoadingStep } from '../../../components/Loader/Step';
import StepInitialize from './Steps/Initialize';
import StepCreateWorkspace from './Steps/CreateWorkspace';
import StepFetchDevfile from './Steps/Fetch/Devfile';
import StepFetchResources from './Steps/Fetch/Resources';
import StepApplyDevfile from './Steps/Apply/Devfile';
import StepApplyResources from './Steps/Apply/Resources';
import StepCheckExistingWorkspaces from './Steps/CheckExistingWorkspaces';

export type Props = {
  currentStepIndex: number;
  history: History;
  loaderSteps: Readonly<List<LoaderStep>>;
  searchParams: URLSearchParams;
  tabParam: string | undefined;
  onNextStep: () => void;
  onRestart: () => void;
};

export default class FactoryLoader extends React.Component<Props> {
  render(): React.ReactElement {
    const { currentStepIndex, loaderSteps } = this.props;

    switch (loaderSteps.get(currentStepIndex).value.id) {
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
