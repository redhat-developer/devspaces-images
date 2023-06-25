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

import { V1alpha2DevWorkspaceStatusConditions } from '@devfile/api';
import common from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { WorkspaceParams } from '../../../../Routes/routes';
import { delay } from '../../../../services/helpers/delay';
import { findTargetWorkspace } from '../../../../services/helpers/factoryFlow/findTargetWorkspace';
import { AlertItem, LoaderTab } from '../../../../services/helpers/types';
import { Workspace } from '../../../../services/workspace-adapter';
import { AppState } from '../../../../store';
import { selectStartTimeout } from '../../../../store/ServerConfig/selectors';
import * as WorkspaceStore from '../../../../store/Workspaces';
import { selectAllWorkspaces } from '../../../../store/Workspaces/selectors';
import { MIN_STEP_DURATION_MS } from '../../const';
import { ProgressStep, ProgressStepProps, ProgressStepState } from '../../ProgressStep';
import { ProgressStepTitle } from '../../StepTitle';
import styles from './index.module.css';

export type ConditionType = V1alpha2DevWorkspaceStatusConditions &
  (
    | {
        message: string;
        status: 'True' | 'False';
      }
    | {
        status: 'Unknown';
      }
  );

export type Props = MappedProps &
  ProgressStepProps & {
    matchParams: WorkspaceParams;
    condition: ConditionType;
  };
export type State = ProgressStepState & {
  isFailed: boolean;
  isReady: boolean;
};

export class StartingStepWorkspaceConditions extends ProgressStep<Props, State> {
  constructor(props: Props) {
    super(props);

    const { condition } = this.props;

    this.state = {
      isReady: false,
      isFailed: false,
      name: condition.message || condition.type,
    };
  }

  protected get name(): string {
    return this.state.name;
  }

  private init() {
    const workspace = this.findTargetWorkspace(this.props);
    const condition = this.findTargetCondition(workspace);

    const isReady = this.state.isReady === true || condition?.status === 'True';
    const isFailed =
      isReady === false && (condition === undefined || condition.status === 'Unknown');

    if (isReady !== this.state.isReady || isFailed !== this.state.isFailed) {
      this.setState({
        isReady,
        isFailed,
      });
    }

    this.prepareAndRun();
  }

  public componentDidMount() {
    this.init();
  }

  public async componentDidUpdate() {
    this.toDispose.dispose();

    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    const workspace = this.findTargetWorkspace(this.props);
    const nextWorkspace = this.findTargetWorkspace(nextProps);

    // change workspace status, etc.
    if (workspace?.uid !== nextWorkspace?.uid || workspace?.status !== nextWorkspace?.status) {
      return true;
    }

    const condition = this.findTargetCondition(workspace);
    const nextCondition = this.findTargetCondition(nextWorkspace);

    if (nextCondition !== undefined && nextCondition.status !== condition?.status) {
      return true;
    }

    if (this.state.isReady !== nextState.isReady || this.state.isFailed !== nextState.isFailed) {
      return true;
    }

    return false;
  }

  public componentWillUnmount() {
    this.toDispose.dispose();
  }

  protected findTargetWorkspace(props: Props): Workspace | undefined {
    return findTargetWorkspace(props.allWorkspaces, props.matchParams);
  }

  private findTargetCondition(workspace: Workspace | undefined): ConditionType | undefined {
    if (workspace?.ref.status?.conditions === undefined) {
      return;
    }

    const condition = workspace.ref.status.conditions.find(
      condition => condition.type === this.props.condition.type,
    );
    return condition ? (condition as ConditionType) : undefined;
  }

  protected async runStep(): Promise<boolean> {
    await delay(MIN_STEP_DURATION_MS);

    if (this.state.isReady) {
      return true;
    }

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
        {
          title: 'Open in Verbose mode',
          callback: () => this.handleRestart(key, LoaderTab.Logs),
        },
      ],
    };
  }

  render() {
    const { isFailed, isReady } = this.state;

    const distance = isReady ? 1 : 0;
    const isError = isFailed;
    const isWarning = false;

    return (
      <React.Fragment>
        <ProgressStepTitle
          className={styles.conditionTitle}
          distance={distance}
          isError={isError}
          isWarning={isWarning}
        >
          {this.name}
        </ProgressStepTitle>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  startTimeout: selectStartTimeout(state),
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StartingStepWorkspaceConditions);
