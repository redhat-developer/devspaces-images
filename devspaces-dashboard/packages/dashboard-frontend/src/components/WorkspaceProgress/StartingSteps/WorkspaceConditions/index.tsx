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

import common from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import isEqual from 'lodash/isEqual';
import React from 'react';

import {
  ProgressStep,
  ProgressStepProps,
  ProgressStepState,
} from '@/components/WorkspaceProgress/ProgressStep';
import styles from '@/components/WorkspaceProgress/StartingSteps/WorkspaceConditions/index.module.css';
import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';
import {
  ConditionType,
  isConditionError,
  isConditionReady,
} from '@/components/WorkspaceProgress/utils';
import { WorkspaceParams } from '@/Routes/routes';
import { AlertItem, LoaderTab } from '@/services/helpers/types';

export type Props = ProgressStepProps & {
  condition: ConditionType;
  matchParams: WorkspaceParams;
};
export type State = ProgressStepState & {
  isError: boolean;
  isReady: boolean;
  condition: ConditionType;
};

export default class StartingStepWorkspaceConditions extends ProgressStep<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = this.buildState(props, undefined, undefined);
  }

  protected get name(): string {
    return this.state.name;
  }

  private buildState(props: Props, prevProps: Props | undefined, state: State | undefined): State {
    const condition = props.condition;
    const prevCondition = prevProps?.condition;

    let name: string;
    if (state === undefined) {
      name = condition.message || condition.type;
    } else {
      name = condition.message || state.name;
    }

    return {
      isReady: isConditionReady(condition, prevCondition),
      isError: isConditionError(condition, prevCondition),
      name,
      condition,
    };
  }

  public componentDidMount() {
    const state = this.buildState(this.props, undefined, this.state);
    this.setState(state);
  }

  public async componentDidUpdate(prevProps: Props) {
    const state = this.buildState(this.props, prevProps, this.state);
    this.setState(state);
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    if (isEqual(this.props.condition, nextProps.condition) === false) {
      return true;
    }

    if (isEqual(this.state.condition, nextState.condition) === false) {
      return true;
    }

    return false;
  }

  public componentWillUnmount() {
    this.toDispose.dispose();
  }
  protected async runStep(): Promise<boolean> {
    return false;
  }

  protected handleRestart(alertKey: string, tab: LoaderTab): void {
    this.props.onHideError(alertKey);

    this.clearStepError();
    this.props.onRestart(tab);
  }

  protected buildAlertItem(error: Error): AlertItem {
    const key = this.name;
    return {
      key,
      title: 'Failed to open the workspace',
      variant: AlertVariant.danger,
      children: common.helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Restart',
          callback: () => this.handleRestart(key, LoaderTab.Progress),
        },
      ],
    };
  }

  render() {
    const { hasChildren } = this.props;
    const { isError, isReady } = this.state;

    const distance = isReady ? 1 : 0;
    const isWarning = false;

    return (
      <React.Fragment>
        <ProgressStepTitle
          className={styles.conditionTitle}
          distance={distance}
          hasChildren={hasChildren}
          isError={isError}
          isWarning={isWarning}
        >
          {this.name}
        </ProgressStepTitle>
      </React.Fragment>
    );
  }
}
