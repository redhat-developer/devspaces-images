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
import { LoaderPage } from '../../../../../../pages/Loader';
import { delay } from '../../../../../../services/helpers/delay';
import { DisposableCollection } from '../../../../../../services/helpers/disposable';
import { AlertItem } from '../../../../../../services/helpers/types';
import { AppState } from '../../../../../../store';
import * as DevfileRegistriesStore from '../../../../../../store/DevfileRegistries';
import { selectDevWorkspaceResources } from '../../../../../../store/DevfileRegistries/selectors';
import { selectAllWorkspaces } from '../../../../../../store/Workspaces/selectors';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../../../AbstractStep';
import { buildFactoryParams, FactoryParams } from '../../../../buildFactoryParams';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_RESOLVE_SEC } from '../../../../const';

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
    const { devWorkspaceResources } = this.props;
    const { factoryParams } = this.state;
    const { sourceUrl } = factoryParams;
    if (sourceUrl && devWorkspaceResources[sourceUrl]?.resources !== undefined) {
      // prevent a resource being fetched one more time
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

    if (devWorkspaceResources[sourceUrl]?.resources) {
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

  private getAlertItem(error: unknown): AlertItem | undefined {
    if (!error) {
      return;
    }
    return {
      key: 'factory-loader-apply-resources',
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
});

const connector = connect(
  mapStateToProps,
  {
    ...DevfileRegistriesStore.actionCreators,
  },
  null,
  {
    // forwardRef is mandatory for using `@react-mock/state` in unit tests
    forwardRef: true,
  },
);
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StepFetchResources);
