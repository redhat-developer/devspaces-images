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

import { helpers } from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import { isEqual } from 'lodash';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { LoaderStep, LoadingStep } from '../../../../../components/Loader/Step';
import { LoaderPage } from '../../../../../pages/Loader';
import { delay } from '../../../../../services/helpers/delay';
import { DisposableCollection } from '../../../../../services/helpers/disposable';
import { buildIdeLoaderLocation } from '../../../../../services/helpers/location';
import { AlertItem } from '../../../../../services/helpers/types';
import { Workspace } from '../../../../../services/workspace-adapter';
import { AppState } from '../../../../../store';
import { selectDevWorkspaceResources } from '../../../../../store/DevfileRegistries/selectors';
import {
  selectFactoryResolver,
  selectFactoryResolverConverted,
} from '../../../../../store/FactoryResolver/selectors';
import { selectAllWorkspaces } from '../../../../../store/Workspaces/selectors';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../../AbstractStep';
import { buildFactoryParams, FactoryParams } from '../../../buildFactoryParams';
import { MIN_STEP_DURATION_MS } from '../../../const';

export class WorkspacesNameConflictError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = 'RunningWorkspacesExceededError';
  }
}

export type Props = MappedProps &
  LoaderStepProps & {
    searchParams: URLSearchParams;
  };
export type State = LoaderStepState & {
  existingWorkspace: Workspace | undefined; // a workspace with the same name that fetched resource has
  factoryParams: FactoryParams;
  shouldCreate: boolean; // should the loader proceed with creating a new workspace or switch to the existing one
  prevLoaderStep: LoaderStep;
};

class StepCheckExistingWorkspaces extends AbstractLoaderStep<Props, State> {
  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    this.state = {
      existingWorkspace: undefined,
      factoryParams: buildFactoryParams(props.searchParams),
      shouldCreate: false,
      prevLoaderStep: props.loaderSteps.get(props.currentStepIndex - 1).value,
    };
  }

  public componentDidMount() {
    this.init();
  }

  public componentDidUpdate() {
    this.toDispose.dispose();

    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // switch to the next step
    if (this.props.currentStepIndex !== nextProps.currentStepIndex) {
      return true;
    }

    // current step failed
    if (!isEqual(this.state.lastError, nextState.lastError)) {
      return true;
    }

    if (this.state.shouldCreate !== nextState.shouldCreate) {
      return true;
    }

    return false;
  }

  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  private init() {
    this.prepareAndRun();
  }

  protected handleRestart(): void {
    this.setState({
      shouldCreate: false,
    });
    this.clearStepError();
    this.props.onRestart();
  }

  private handleNameConflict(action: 'create-new' | 'open-existing'): void {
    if (action === 'create-new') {
      // proceed with creating an new workspace
      this.setState({
        shouldCreate: true,
      });
      this.clearStepError();
      return;
    }

    // open workspace flow for the existing workspace
    const { existingWorkspace } = this.state;
    // at this moment existing workspace must be defined
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const nextLocation = buildIdeLoaderLocation(existingWorkspace!);
    this.props.history.push(nextLocation);
    this.props.history.go(0);
  }

  protected async runStep(): Promise<boolean> {
    await delay(MIN_STEP_DURATION_MS);

    const { devWorkspaceResources, factoryResolver, factoryResolverConverted } = this.props;
    const { factoryParams, shouldCreate, prevLoaderStep } = this.state;

    if (shouldCreate) {
      // user decided to create a new workspace
      return true;
    }
    if (factoryParams.policiesCreate === 'perclick') {
      // continue creating new workspace in accordance to the policy
      return true;
    }

    let newWorkspaceName: string;
    if (prevLoaderStep.id === LoadingStep.CREATE_WORKSPACE__FETCH_DEVFILE) {
      if (
        factoryResolver?.location === factoryParams.sourceUrl &&
        factoryResolverConverted?.devfileV2 !== undefined
      ) {
        const devfile = factoryResolverConverted.devfileV2;
        newWorkspaceName = devfile.metadata.name;
      } else {
        if (factoryResolver === undefined) {
          return true;
        }
        throw new Error('Failed to resolve the devfile.');
      }
    } else {
      const resources = devWorkspaceResources[factoryParams.sourceUrl]?.resources;
      if (resources === undefined) {
        throw new Error('Failed to fetch devworkspace resources.');
      }

      const [devWorkspace] = resources;
      newWorkspaceName = devWorkspace.metadata.name;
    }

    // check existing workspaces to avoid name conflicts
    const existingWorkspace = this.props.allWorkspaces.find(w => newWorkspaceName === w.name);
    if (existingWorkspace) {
      // detected workspaces name conflict
      this.setStepError(
        new WorkspacesNameConflictError(
          `A workspace with the same name (${existingWorkspace.name}) has been found. Should you want to open the existing workspace or proceed to create a new one, please choose the corresponding action.`,
        ),
      );
      this.setState({
        existingWorkspace,
      });
      return false;
    }

    return true;
  }

  private getAlertItem(error: unknown): AlertItem | undefined {
    if (error instanceof WorkspacesNameConflictError) {
      return {
        key: 'factory-loader-check-existing-workspaces',
        title: 'Existing workspace found',
        variant: AlertVariant.warning,
        children: helpers.errors.getMessage(error),
        actionCallbacks: [
          {
            title: 'Open the existing workspace',
            callback: () => this.handleNameConflict('open-existing'),
          },
          {
            title: 'Create a new workspace',
            callback: () => this.handleNameConflict('create-new'),
          },
        ],
      };
    }
    if (!error) {
      return;
    }
    return {
      key: 'factory-loader-check-existing-workspaces',
      title: 'Failed to create the workspace',
      variant: AlertVariant.danger,
      children: helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Click to try again',
          callback: () => this.handleRestart(),
        },
      ],
    };
  }

  render(): React.ReactElement {
    const { currentStepIndex, loaderSteps, tabParam } = this.props;
    const { lastError } = this.state;

    const steps = loaderSteps.values;
    const currentStepId = loaderSteps.get(currentStepIndex).value.id;

    const alertItem = this.getAlertItem(lastError);

    return (
      <LoaderPage
        alertItem={alertItem}
        currentStepId={currentStepId}
        steps={steps}
        tabParam={tabParam}
        workspace={undefined}
        onTabChange={tab => this.handleTabChange(tab)}
      />
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  devWorkspaceResources: selectDevWorkspaceResources(state),
  factoryResolver: selectFactoryResolver(state),
  factoryResolverConverted: selectFactoryResolverConverted(state),
});

const connector = connect(mapStateToProps, null, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StepCheckExistingWorkspaces);
