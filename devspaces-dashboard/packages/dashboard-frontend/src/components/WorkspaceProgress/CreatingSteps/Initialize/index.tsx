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
import { AlertVariant, pluralize } from '@patternfly/react-core';
import isEqual from 'lodash/isEqual';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { generatePath } from 'react-router-dom';
import { ROUTE } from '../../../../Routes/routes';
import {
  buildFactoryParams,
  FactoryParams,
  PoliciesCreate,
} from '../../../../services/helpers/factoryFlow/buildFactoryParams';
import { delay } from '../../../../services/helpers/delay';
import { DisposableCollection } from '../../../../services/helpers/disposable';
import { AlertItem } from '../../../../services/helpers/types';
import { AppState } from '../../../../store';
import { selectAllWorkspacesLimit } from '../../../../store/ClusterConfig/selectors';
import { selectInfrastructureNamespaces } from '../../../../store/InfrastructureNamespaces/selectors';
import { selectAllWorkspaces } from '../../../../store/Workspaces/selectors';
import { MIN_STEP_DURATION_MS } from '../../const';
import { ProgressStep, ProgressStepProps, ProgressStepState } from '../../ProgressStep';
import { ProgressStepTitle } from '../../StepTitle';

export type Props = MappedProps &
  ProgressStepProps & {
    searchParams: URLSearchParams;
  };
export type State = ProgressStepState & {
  factoryParams: FactoryParams;
};

class CreatingStepInitialize extends ProgressStep<Props, State> {
  protected readonly name = 'Initializing';
  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
      name: this.name,
    };
  }

  private init(): void {
    if (this.props.distance !== 0) {
      return;
    }

    if (this.state.lastError) {
      return;
    }

    this.prepareAndRun();
  }

  public componentDidMount() {
    this.init();
  }

  public componentDidUpdate() {
    this.toDispose.dispose();

    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // active step changed
    if (this.props.distance !== nextProps.distance) {
      return true;
    }

    // current step failed
    if (!isEqual(this.state.lastError, nextState.lastError)) {
      return true;
    }

    return false;
  }

  protected async runStep(): Promise<boolean> {
    await delay(MIN_STEP_DURATION_MS);

    const { useDevworkspaceResources, sourceUrl, errorCode, policiesCreate, remotes } =
      this.state.factoryParams;

    if (useDevworkspaceResources === true && sourceUrl === '') {
      throw new Error('Devworkspace resources URL is missing.');
    } else if (useDevworkspaceResources === false && sourceUrl === '' && !remotes) {
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
        `Unsupported create policy "${policiesCreate}" is specified while the only following are supported: peruser, perclick. Please fix "policies.create" parameter and try again.`,
      );
    }

    // check for a pre-created infrastructure namespace
    const namespaces = this.props.infrastructureNamespaces;
    if (namespaces.length === 0 || (namespaces.length === 1 && !namespaces[0].attributes.phase)) {
      throw new Error(
        'Failed to create a workspace. The infrastructure namespace is required to be created. Please, contact the cluster administrator.',
      );
    }

    this.checkAllWorkspacesLimitExceeded();

    return true;
  }

  private isCreatePolicy(val: string): val is PoliciesCreate {
    return (val && (val as PoliciesCreate) === 'perclick') || (val as PoliciesCreate) === 'peruser';
  }

  private handleRestart(alertKey: string): void {
    this.props.onHideError(alertKey);
    this.props.onRestart();
  }

  protected buildAlertItem(error: Error): AlertItem {
    const key = this.name;
    return {
      key,
      title: 'Failed to create the workspace',
      variant: AlertVariant.danger,
      children: helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Click to try again',
          callback: () => this.handleRestart(key),
        },
      ],
    };
  }

  private checkAllWorkspacesLimitExceeded() {
    if (
      this.props.allWorkspacesLimit !== -1 &&
      this.props.allWorkspaces.length >= this.props.allWorkspacesLimit
    ) {
      const number = this.props.allWorkspacesLimit;
      const message = `You can only keep ${pluralize(number, 'workspace')}.`;
      throw new AllWorkspacesExceededError(message);
    }
  }

  render(): React.ReactElement {
    const { distance } = this.props;
    const { name, lastError } = this.state;

    const isError = lastError !== undefined;
    const isWarning = false;

    return (
      <React.Fragment>
        <ProgressStepTitle distance={distance} isError={isError} isWarning={isWarning}>
          {name}
        </ProgressStepTitle>
      </React.Fragment>
    );
  }
}

export class AllWorkspacesExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AllWorkspacesExceededError';
  }
}

const mapStateToProps = (state: AppState) => ({
  infrastructureNamespaces: selectInfrastructureNamespaces(state),
  allWorkspaces: selectAllWorkspaces(state),
  allWorkspacesLimit: selectAllWorkspacesLimit(state),
});

const connector = connect(mapStateToProps, {}, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(CreatingStepInitialize);
