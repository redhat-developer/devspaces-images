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

import { TIMEOUT_TO_RESOLVE_SEC } from '@/components/WorkspaceProgress/const';
import {
  ProgressStep,
  ProgressStepProps,
  ProgressStepState,
} from '@/components/WorkspaceProgress/ProgressStep';
import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';
import { TimeLimit } from '@/components/WorkspaceProgress/TimeLimit';
import {
  buildFactoryParams,
  FactoryParams,
} from '@/services/helpers/factoryFlow/buildFactoryParams';
import { AlertItem } from '@/services/helpers/types';
import { AppState } from '@/store';
import * as DevfileRegistriesStore from '@/store/DevfileRegistries';
import { selectDevWorkspaceResources } from '@/store/DevfileRegistries/selectors';
import { selectAllWorkspaces } from '@/store/Workspaces/selectors';

export type Props = MappedProps &
  ProgressStepProps & {
    searchParams: URLSearchParams;
  };
export type State = ProgressStepState & {
  factoryParams: FactoryParams;
  shouldResolve: boolean;
};

class CreatingStepFetchResources extends ProgressStep<Props, State> {
  protected readonly name = 'Fetching pre-built resources';

  constructor(props: Props) {
    super(props);

    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
      shouldResolve: true,
      name: this.name,
    };
  }

  public componentDidMount() {
    this.init();
  }

  public componentDidUpdate() {
    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // active step changed
    if (this.props.distance !== nextProps.distance) {
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
    if (this.props.distance !== 0) {
      return;
    }

    if (this.state.lastError) {
      return;
    }

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

  protected handleRestart(alertKey: string): void {
    this.props.onHideError(alertKey);

    this.setState({
      shouldResolve: true,
    });
    this.clearStepError();
    this.props.onRestart();
  }

  protected handleTimeout(): void {
    const timeoutError = new Error(
      `Pre-built resources haven't been fetched in the last ${TIMEOUT_TO_RESOLVE_SEC} seconds.`,
    );
    this.handleError(timeoutError);
  }

  protected async runStep(): Promise<boolean> {
    const { devWorkspaceResources } = this.props;
    const { factoryParams, shouldResolve } = this.state;
    const { sourceUrl } = factoryParams;

    if (devWorkspaceResources[sourceUrl]?.resources) {
      // pre-built resources fetched successfully
      return true;
    }

    if (shouldResolve === false) {
      throw new Error('Failed to fetch pre-built resources');
    }

    await this.props.requestResources(sourceUrl);

    // wait for fetching resources to complete
    return false;
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

  render(): React.ReactElement {
    const { distance, hasChildren } = this.props;
    const { name, lastError } = this.state;

    const isActive = distance === 0;
    const isError = lastError !== undefined;
    const isWarning = false;

    return (
      <React.Fragment>
        {isActive && (
          <TimeLimit timeLimitSec={TIMEOUT_TO_RESOLVE_SEC} onTimeout={() => this.handleTimeout()} />
        )}
        <ProgressStepTitle
          distance={distance}
          hasChildren={hasChildren}
          isError={isError}
          isWarning={isWarning}
        >
          {name}
        </ProgressStepTitle>
      </React.Fragment>
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
export default connector(CreatingStepFetchResources);
