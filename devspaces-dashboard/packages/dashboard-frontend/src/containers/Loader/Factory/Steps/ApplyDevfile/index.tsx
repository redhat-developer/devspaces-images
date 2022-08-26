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
import * as WorkspacesStore from '../../../../../store/Workspaces';
import { DisposableCollection } from '../../../../../services/helpers/disposable';
import { selectAllWorkspaces } from '../../../../../store/Workspaces/selectors';
import { delay } from '../../../../../services/helpers/delay';
import devfileApi from '../../../../../services/devfileApi';
import { FactoryLoaderPage } from '../../../../../pages/Loader/Factory';
import getRandomString from '../../../../../services/helpers/random';
import { selectDefaultNamespace } from '../../../../../store/InfrastructureNamespaces/selectors';
import {
  selectFactoryResolver,
  selectFactoryResolverConverted,
} from '../../../../../store/FactoryResolver/selectors';
import { prepareDevfile } from './prepareDevfile';
import { findTargetWorkspace } from '../findTargetWorkspace';
import { buildIdeLoaderLocation } from '../../../../../services/helpers/location';
import { Workspace } from '../../../../../services/workspace-adapter';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_CREATE_SEC } from '../../../const';
import { FactoryParams } from '../../types';
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

class StepApplyDevfile extends AbstractLoaderStep<Props, State> {
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

    const { factoryResolverConverted } = this.props;
    const { shouldCreate, factoryParams } = this.state;
    const { factoryId, policiesCreate, storageType } = factoryParams;

    const workspace = this.findTargetWorkspace(this.props, this.state);
    if (workspace !== undefined) {
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

    const devfile = factoryResolverConverted?.devfileV2;
    if (devfile === undefined) {
      throw new Error('Failed to resolve the devfile.');
    }

    const updatedDevfile = prepareDevfile(devfile, factoryId, policiesCreate, storageType);

    const { newWorkspaceName } = this.state;
    if (newWorkspaceName !== updatedDevfile.metadata.name) {
      this.setState({
        newWorkspaceName: devfile.metadata.name,
      });
      return false;
    }

    await this.createWorkspaceFromDevfile(updatedDevfile);

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

  private async createWorkspaceFromDevfile(devfile: devfileApi.Devfile): Promise<void> {
    const params = Object.fromEntries(this.props.searchParams);
    const infrastructureNamespace = this.props.defaultNamespace.name;
    const optionalFilesContent = this.props.factoryResolver?.optionalFilesContent || {};
    await this.props.createWorkspaceFromDevfile(
      devfile,
      undefined,
      infrastructureNamespace,
      params,
      optionalFilesContent,
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
  factoryResolver: selectFactoryResolver(state),
  factoryResolverConverted: selectFactoryResolverConverted(state),
});

const connector = connect(mapStateToProps, {
  ...WorkspacesStore.actionCreators,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(withRouter(StepApplyDevfile));
