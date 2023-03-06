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
import { matchPath, RouteComponentProps } from 'react-router-dom';
import { List, LoaderStep, LoadingStep } from '../../components/Loader/Step';
import {
  buildLoaderSteps,
  FactorySource,
  getFactoryLoadingSteps,
  getWorkspaceLoadingSteps,
} from '../../components/Loader/Step/buildSteps';
import { ROUTE, WorkspaceParams } from '../../Routes/routes';
import { sanitizeLocation } from '../../services/helpers/location';
import { LoaderTab } from '../../services/helpers/types';
import { buildFactoryParams } from './buildFactoryParams';
import FactoryLoader from './Factory';
import WorkspaceLoader from './Workspace';

type LoaderMode =
  | { mode: 'factory'; ideLoaderParams?: undefined }
  | { mode: 'workspace'; workspaceParams: WorkspaceParams };

export type Props = MappedProps & RouteComponentProps;
export type State = {
  currentStepIndex: number;
  initialMode: LoaderMode['mode'];
  searchParams: URLSearchParams;
  tabParam: string | undefined;
  loaderSteps: Readonly<List<LoaderStep>>;
};

/**
 * This class handles factories and workspaces loading flows depending on the location state.
 *
 * Workspace flow.
 * If location path matches `/ide/{namespace}/{workspaceName}` loader renders the `WorkspaceLoader` container which, in turn, starts the workspace by it's qualified name and opens the editor.
 *
 * Factory flow.
 * This flow starts if location path doesn't match the pattern above. The `FactoryLoader` container gets rendered to resolve necessary resources (either devfile or pre-built devworkspace) and to create a new workspace. Once that's done, the `FactoryLoader` container changes location to switch to the workspaces loading flow. `WorkspaceLoader` container is in charge to perform the final steps of the factory flow - to start the workspace and open the editor.
 */
class LoaderContainer extends React.Component<Props, State> {
  private readonly steps: LoadingStep[];

  constructor(props: Props) {
    super(props);

    const { location: dirtyLocation } = this.props.history;
    const { search } = sanitizeLocation(dirtyLocation);
    const searchParams = new URLSearchParams(search);
    const tabParam = searchParams.get('tab') || undefined;

    const { mode } = this.getMode(props);
    if (mode === 'workspace') {
      this.steps = getWorkspaceLoadingSteps();
    } else {
      const factoryParams = buildFactoryParams(searchParams);
      const factorySource: FactorySource = factoryParams.useDevworkspaceResources
        ? 'devworkspace'
        : 'devfile';
      this.steps = getFactoryLoadingSteps(factorySource);
    }

    this.state = {
      currentStepIndex: 0,
      initialMode: mode,
      loaderSteps: buildLoaderSteps(this.steps),
      searchParams,
      tabParam,
    };
  }

  private getMode(props: Props): LoaderMode {
    const workspaceLoaderPath = matchPath<WorkspaceParams>(props.history.location.pathname, {
      path: ROUTE.IDE_LOADER,
      exact: true,
    });
    if (workspaceLoaderPath) {
      return { mode: 'workspace', workspaceParams: workspaceLoaderPath.params };
    } else {
      return { mode: 'factory' };
    }
  }

  private handleNextStep(): void {
    const { currentStepIndex, loaderSteps } = this.state;
    const currentStep = loaderSteps.get(currentStepIndex);

    if (currentStep.hasNext() === false) {
      return;
    }

    this.setState({
      currentStepIndex: currentStep.next.index,
    });
  }

  private handleRestart(tabName?: string): void {
    const { initialMode } = this.state;

    const tabParam = tabName && LoaderTab[tabName] ? tabName : LoaderTab[LoaderTab.Progress];

    const { mode } = this.getMode(this.props);
    if (initialMode === mode) {
      this.setState({
        currentStepIndex: 0,
        tabParam,
      });
    } else {
      // The workspace loader finalizes the factory loading flow - starts the workspace and opens the editor.

      // START_WORKSPACE step is always present in the array
      const startWorkspaceIndex = this.steps.findIndex(
        step => step === LoadingStep.START_WORKSPACE,
      );
      this.setState({
        currentStepIndex: startWorkspaceIndex,
        tabParam,
      });
    }
  }

  private handleTabChange(tabName: string): void {
    this.setState({
      tabParam: tabName,
    });
  }

  render(): React.ReactElement {
    const { currentStepIndex, loaderSteps, tabParam, searchParams } = this.state;
    const { history } = this.props;

    const loaderMode = this.getMode(this.props);
    if (loaderMode.mode === 'factory') {
      return (
        <FactoryLoader
          currentStepIndex={currentStepIndex}
          history={history}
          loaderSteps={loaderSteps}
          searchParams={searchParams}
          matchParams={loaderMode.ideLoaderParams}
          tabParam={tabParam}
          onNextStep={() => this.handleNextStep()}
          onRestart={() => this.handleRestart()}
          onTabChange={tabName => this.handleTabChange(tabName)}
        />
      );
    } else {
      return (
        <WorkspaceLoader
          currentStepIndex={currentStepIndex}
          history={history}
          loaderSteps={loaderSteps}
          matchParams={loaderMode.workspaceParams}
          tabParam={tabParam}
          onNextStep={() => this.handleNextStep()}
          onRestart={tabName => this.handleRestart(tabName)}
          onTabChange={tabName => this.handleTabChange(tabName)}
        />
      );
    }
  }
}

const connector = connect(null, null, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(LoaderContainer);
