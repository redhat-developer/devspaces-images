/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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
import { PureSubCondition } from '@/components/WorkspaceProgress/StartingSteps/WorkspaceConditions/PureSubCondition';
import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';
import {
  ConditionType,
  isConditionError,
  isConditionReady,
} from '@/components/WorkspaceProgress/utils';
import { WorkspaceRouteParams } from '@/Routes';
import { AlertItem, LoaderTab } from '@/services/helpers/types';

export type Props = ProgressStepProps & {
  condition: ConditionType;
  matchParams: WorkspaceRouteParams;
};
export type State = ProgressStepState & {
  isWarning: boolean;
  isReady: boolean;
  condition: ConditionType;
  subConditionTitle: string;
};

export default class StartingStepWorkspaceConditions extends ProgressStep<Props, State> {
  private timerId: number | undefined;

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
    let subConditionTitle: string;
    if (state === undefined) {
      name = condition.message || condition.type;
      subConditionTitle = '';
    } else {
      name = condition.message || state.name;
      subConditionTitle = state.subConditionTitle;
    }

    return {
      isReady: isConditionReady(condition, prevCondition),
      isWarning: isConditionError(condition, prevCondition),
      name,
      condition,
      subConditionTitle,
    };
  }

  private checkForSubCondition(condition: ConditionType): void {
    if (this.timerId !== undefined || condition.status !== 'False') {
      return;
    }

    // Show sub-condition only for DeploymentReady
    if (condition.type === 'DeploymentReady') {
      // Show sub-condition after 20 seconds
      this.timerId = window.setTimeout(() => {
        this.setState({
          subConditionTitle:
            'Downloading IDE binaries... (it can take a few minutes depending on your internet connection)',
        });
      }, 20000);
    }
  }

  public componentDidMount() {
    const state = this.buildState(this.props, undefined, this.state);
    this.setState(state);

    this.checkForSubCondition(state.condition);
  }

  public async componentDidUpdate(prevProps: Props) {
    const state = this.buildState(this.props, prevProps, this.state);
    this.setState(state);

    if (state.subConditionTitle === '') {
      this.checkForSubCondition(state.condition);
    }
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    if (!isEqual(this.props.condition, nextProps.condition)) {
      return true;
    }

    if (!isEqual(this.state.condition, nextState.condition)) {
      return true;
    }

    if (this.state.subConditionTitle !== nextState.subConditionTitle) {
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
    const { isWarning: isWarning, isReady, subConditionTitle } = this.state;
    const hasChildren = this.props.hasChildren || !!subConditionTitle;

    const distance = isReady ? 1 : 0;
    const isError = false;

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
          <PureSubCondition distance={distance} title={subConditionTitle} />
        </ProgressStepTitle>
      </React.Fragment>
    );
  }
}
