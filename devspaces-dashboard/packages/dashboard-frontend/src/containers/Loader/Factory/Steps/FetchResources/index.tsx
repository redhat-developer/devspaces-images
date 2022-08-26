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
import { isEqual } from 'lodash';
import { AlertVariant } from '@patternfly/react-core';
import { helpers } from '@eclipse-che/common';
import { AppState } from '../../../../../store';
import * as DevfileRegistriesStore from '../../../../../store/DevfileRegistries';
import { DisposableCollection } from '../../../../../services/helpers/disposable';
import { selectAllWorkspaces } from '../../../../../store/Workspaces/selectors';
import { delay } from '../../../../../services/helpers/delay';
import { FactoryLoaderPage } from '../../../../../pages/Loader/Factory';
import { findTargetWorkspace } from '../findTargetWorkspace';
import { selectDevWorkspaceResources } from '../../../../../store/DevfileRegistries/selectors';
import { Workspace } from '../../../../../services/workspace-adapter';
import { FactoryParams } from '../../types';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_RESOLVE_SEC } from '../../../const';
import buildFactoryParams from '../../buildFactoryParams';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../../AbstractStep';

export type Props = MappedProps &
  LoaderStepProps & {
    searchParams: URLSearchParams;
  };
export type State = LoaderStepState & {
  factoryParams: FactoryParams;
  shouldResolve: boolean;
};

class StepFetchResources extends AbstractLoaderStep<Props, State> {
  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
      shouldResolve: true,
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

    // factory resolver got updated
    const { sourceUrl } = this.state.factoryParams;
    // devworkspace resources fetched
    if (
      sourceUrl &&
      this.props.devWorkspaceResources[sourceUrl]?.resources === undefined &&
      nextProps.devWorkspaceResources[sourceUrl]?.resources !== undefined
    ) {
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

    if (this.state.shouldResolve !== nextState.shouldResolve) {
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
      // prevent a resource being fetched one more time
      this.setState({
        shouldResolve: false,
      });
    }

    const { devWorkspaceResources } = this.props;
    const { factoryParams } = this.state;
    const { sourceUrl } = factoryParams;
    if (sourceUrl && devWorkspaceResources[sourceUrl]?.resources !== undefined) {
      this.setState({
        shouldResolve: false,
      });
    }

    this.prepareAndRun();
  }

  protected handleRestart(): void {
    this.setState({
      shouldResolve: true,
    });
    this.clearStepError();
    this.props.onRestart();
  }

  protected async runStep(): Promise<boolean> {
    await delay(MIN_STEP_DURATION_MS);

    const { devWorkspaceResources } = this.props;
    const { factoryParams, lastError, shouldResolve } = this.state;
    const { sourceUrl } = factoryParams;

    const workspace = this.findTargetWorkspace(this.props, this.state);
    if (workspace) {
      // the workspace has been created, go to the next step
      return true;
    }

    if (devWorkspaceResources[sourceUrl]) {
      // pre-built resources fetched successfully
      return true;
    }

    if (shouldResolve === false) {
      if (lastError instanceof Error) {
        throw lastError;
      }
      throw new Error('Failed to fetch pre-built resources');
    }

    await this.props.requestResources(sourceUrl);

    // wait for fetching resources to complete
    try {
      await this.waitForStepDone(TIMEOUT_TO_RESOLVE_SEC);

      // do not switch to the next step
      return false;
    } catch (e) {
      throw new Error(
        `Pre-built resources haven't been fetched in the last ${TIMEOUT_TO_RESOLVE_SEC} seconds.`,
      );
    }
  }

  private findTargetWorkspace(props: Props, state: State): Workspace | undefined {
    return findTargetWorkspace(
      props.allWorkspaces,
      state.factoryParams.factoryId,
      state.factoryParams.policiesCreate,
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
            key: 'factory-loader-fetch-resources',
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
  devWorkspaceResources: selectDevWorkspaceResources(state),
});

const connector = connect(mapStateToProps, {
  ...DevfileRegistriesStore.actionCreators,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StepFetchResources);
