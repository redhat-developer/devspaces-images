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
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { isEqual } from 'lodash';
import { AlertVariant } from '@patternfly/react-core';
import { helpers } from '@eclipse-che/common';
import { AppState } from '../../../../../store';
import * as FactoryResolverStore from '../../../../../store/FactoryResolver';
import * as WorkspacesStore from '../../../../../store/Workspaces';
import * as DevWorkspacesStore from '../../../../../store/Workspaces/devWorkspaces';
import * as DevfileRegistriesStore from '../../../../../store/DevfileRegistries';
import { DisposableCollection } from '../../../../../services/helpers/disposable';
import { selectAllWorkspaces } from '../../../../../store/Workspaces/selectors';
import { selectDevworkspacesEnabled } from '../../../../../store/Workspaces/Settings/selectors';
import { delay } from '../../../../../services/helpers/delay';
import { FactoryLoaderPage } from '../../../../../pages/Loader/Factory';
import getRandomString from '../../../../../services/helpers/random';
import {
  selectDefaultNamespace,
  selectInfrastructureNamespaces,
} from '../../../../../store/InfrastructureNamespaces/selectors';
import {
  selectFactoryResolver,
  selectFactoryResolverConverted,
} from '../../../../../store/FactoryResolver/selectors';
import { prepareResources } from './prepareResources';
import { findTargetWorkspace } from '../findTargetWorkspace';
import { selectDevWorkspaceResources } from '../../../../../store/DevfileRegistries/selectors';
import { buildIdeLoaderLocation } from '../../../../../services/helpers/location';
import { Workspace } from '../../../../../services/workspace-adapter';
import { FactoryParams } from '../../types';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_CREATE_SEC } from '../../../const';
import buildFactoryParams from '../../buildFactoryParams';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../../AbstractStep';

export type Props = MappedProps &
  RouteComponentProps &
  LoaderStepProps & {
    searchParams: URLSearchParams;
  };
export type State = LoaderStepState & {
  factoryParams: FactoryParams;
  newWorkspaceName?: string;
  shouldCreate: boolean; // should the loader create a workspace
};

class StepApplyResources extends AbstractLoaderStep<Props, State> {
  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
      shouldCreate: true,
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
    const workspace = this.findTargetWorkspace(this.props, this.state);
    const nextWorkspace = this.findTargetWorkspace(nextProps, nextState);

    // switch to the next step
    if (this.props.currentStepIndex !== nextProps.currentStepIndex) {
      return true;
    }

    // new workspace appeared
    if (workspace === undefined && nextWorkspace !== undefined) {
      return true;
    }

    // current step failed
    if (!isEqual(this.state.lastError, nextState.lastError)) {
      return true;
    }

    if (this.state.shouldCreate !== nextState.shouldCreate) {
      return true;
    }

    if (this.state.newWorkspaceName !== nextState.newWorkspaceName) {
      return true;
    }

    return false;
  }

  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  private init() {
    const workspace = this.findTargetWorkspace(this.props, this.state);

    if (workspace) {
      // prevent a workspace being created one more time
      this.setState({
        shouldCreate: false,
      });
    }

    this.prepareAndRun();
  }

  protected handleRestart(): void {
    this.setState({
      shouldCreate: true,
      newWorkspaceName: undefined,
    });
    this.clearStepError();
    this.props.onRestart();
  }

  protected async runStep(): Promise<boolean> {
    await delay(MIN_STEP_DURATION_MS);

    const { devWorkspaceResources } = this.props;
    const { factoryParams, shouldCreate } = this.state;
    const { cheEditor, factoryId, sourceUrl, storageType } = factoryParams;

    const workspace = this.findTargetWorkspace(this.props, this.state);
    if (workspace) {
      // the workspace has been created, go to the next step
      const nextLocation = buildIdeLoaderLocation(workspace);
      this.props.location.pathname = nextLocation.pathname;
      this.props.location.search = '';
      return true;
    }

    if (shouldCreate === false) {
      if (this.state.lastError instanceof Error) {
        throw this.state.lastError;
      }
      throw new Error('The workspace creation unexpectedly failed.');
    }

    const resources = devWorkspaceResources[sourceUrl]?.resources;
    if (resources === undefined) {
      throw new Error('Failed to fetch devworkspace resources.');
    }

    // create a workspace using pre-generated resources
    const [devWorkspace, devWorkspaceTemplate] = prepareResources(
      resources,
      factoryId,
      storageType,
    );

    const { newWorkspaceName } = this.state;
    if (newWorkspaceName !== devWorkspace.metadata.name) {
      this.setState({
        newWorkspaceName: devWorkspace.metadata.name,
      });
      return false;
    }

    await this.props.createWorkspaceFromResources(devWorkspace, devWorkspaceTemplate, cheEditor);

    // wait for the workspace creation to complete
    try {
      await this.waitForStepDone(TIMEOUT_TO_CREATE_SEC);

      // do not switch to the next step
      return false;
    } catch (e) {
      throw new Error(
        `Workspace hasn't been created in the last ${TIMEOUT_TO_CREATE_SEC} seconds.`,
      );
    }
  }

  private findTargetWorkspace(props: Props, state: State): Workspace | undefined {
    return findTargetWorkspace(
      props.allWorkspaces,
      state.factoryParams.factoryId,
      state.factoryParams.policiesCreate,
      state.newWorkspaceName,
    );
  }

  render(): React.ReactElement {
    const { currentStepIndex, loaderSteps, tabParam } = this.props;
    const { lastError } = this.state;

    const steps = loaderSteps.values;
    const currentStepId = loaderSteps.get(currentStepIndex).value.id;

    const alertItem =
      lastError === undefined
        ? undefined
        : {
            key: 'factory-loader-' + getRandomString(4),
            title: 'Failed to create the workspace',
            variant: AlertVariant.danger,
            children: helpers.errors.getMessage(lastError),
          };

    return (
      <FactoryLoaderPage
        alertItem={alertItem}
        currentStepId={currentStepId}
        steps={steps}
        tabParam={tabParam}
        onRestart={() => this.handleRestart()}
      />
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  defaultNamespace: selectDefaultNamespace(state),
  devworkspacesEnabled: selectDevworkspacesEnabled(state),
  factoryResolver: selectFactoryResolver(state),
  factoryResolverConverted: selectFactoryResolverConverted(state),
  infrastructureNamespaces: selectInfrastructureNamespaces(state),
  devWorkspaceResources: selectDevWorkspaceResources(state),
});

const connector = connect(mapStateToProps, {
  ...DevfileRegistriesStore.actionCreators,
  ...FactoryResolverStore.actionCreators,
  ...WorkspacesStore.actionCreators,
  createWorkspaceFromResources: DevWorkspacesStore.actionCreators.createWorkspaceFromResources,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(withRouter(StepApplyResources));
