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
import { generatePath } from 'react-router-dom';
import { isEqual } from 'lodash';
import { AlertVariant } from '@patternfly/react-core';
import { helpers } from '@eclipse-che/common';
import { AppState } from '../../../../../store';
import { selectInfrastructureNamespaces } from '../../../../../store/InfrastructureNamespaces/selectors';
import { DisposableCollection } from '../../../../../services/helpers/disposable';
import { delay } from '../../../../../services/helpers/delay';
import { ROUTE } from '../../../../../Routes/routes';
import { FactoryLoaderPage } from '../../../../../pages/Loader/Factory';
import { FactoryParams, PoliciesCreate } from '../../types';
import { MIN_STEP_DURATION_MS } from '../../../const';
import buildFactoryParams from '../../buildFactoryParams';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../../AbstractStep';

export type Props = MappedProps &
  LoaderStepProps & {
    searchParams: URLSearchParams;
  };
export type State = LoaderStepState & {
  factoryParams: FactoryParams;
};

class StepInitialize extends AbstractLoaderStep<Props, State> {
  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
    };
  }

  public componentDidMount() {
    this.prepareAndRun();
  }

  public componentDidUpdate() {
    this.toDispose.dispose();
    this.prepareAndRun();
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

    return false;
  }

  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  protected async handleRestart(): Promise<void> {
    this.clearStepError();
    this.props.onRestart();
  }

  protected async runStep(): Promise<boolean> {
    await delay(MIN_STEP_DURATION_MS);

    const { useDevworkspaceResources, sourceUrl, errorCode, policiesCreate } =
      this.state.factoryParams;

    if (useDevworkspaceResources === true && sourceUrl === '') {
      throw new Error('Devworkspace resources URL is missing.');
    } else if (useDevworkspaceResources === false && sourceUrl === '') {
      const factoryPath = generatePath(ROUTE.FACTORY_LOADER_URL, {
        url: 'your-repository-url',
      });
      throw new Error(
        `Repository/Devfile URL is missing. Please specify it via url query param: ${window.location.origin}${window.location.pathname}#${factoryPath}`,
      );
    }

    // find error codes
    if (errorCode === 'invalid_request') {
      throw new Error(
        'Could not resolve devfile from private repository because authentication request is missing a parameter, contains an invalid parameter, includes a parameter more than once, or is otherwise invalid.',
      );
    }

    // validate creation policies
    if (this.isCreatePolicy(policiesCreate) === false) {
      throw new Error(
        `Unsupported create policy '${policiesCreate}' is specified while the only following are supported: peruser, perclick. Please fix 'policies.create' parameter and try again.`,
      );
    }

    // check for a pre-created infrastructure namespace
    const namespaces = this.props.infrastructureNamespaces;
    if (namespaces.length === 0 || (namespaces.length === 1 && !namespaces[0].attributes.phase)) {
      throw new Error(
        'Failed to accept the factory URL. The infrastructure namespace is required to be created. Please create a regular workspace to workaround the issue and open factory URL again.',
      );
    }

    return true;
  }

  private isCreatePolicy(val: string): val is PoliciesCreate {
    return (val && (val as PoliciesCreate) === 'perclick') || (val as PoliciesCreate) === 'peruser';
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
            key: 'factory-loader-initialize',
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
  infrastructureNamespaces: selectInfrastructureNamespaces(state),
});

const connector = connect(mapStateToProps, {});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StepInitialize);
