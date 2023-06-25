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

import * as PF from '@patternfly/react-core';
import { History } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import {
  buildFactoryParams,
  FactoryParams,
} from '../../services/helpers/factoryFlow/buildFactoryParams';
import { findTargetWorkspace } from '../../services/helpers/factoryFlow/findTargetWorkspace';
import { getLoaderMode, LoaderMode } from '../../services/helpers/factoryFlow/getLoaderMode';
import { AlertItem, DevWorkspaceStatus, LoaderTab } from '../../services/helpers/types';
import { AppState } from '../../store';
import * as WorkspaceStore from '../../store/Workspaces';
import { selectAllWorkspaces } from '../../store/Workspaces/selectors';
import { ProgressAlert } from './Alert';
import CommonStepCheckRunningWorkspacesLimit from './CommonSteps/CheckRunningWorkspacesLimit';
import CreatingStepApplyDevfile from './CreatingSteps/Apply/Devfile';
import CreatingStepApplyResources from './CreatingSteps/Apply/Resources';
import CreatingStepCheckExistingWorkspaces from './CreatingSteps/CheckExistingWorkspaces';
import CreatingStepCreateWorkspace from './CreatingSteps/CreateWorkspace';
import CreatingStepFetchDevfile from './CreatingSteps/Fetch/Devfile';
import CreatingStepFetchResources from './CreatingSteps/Fetch/Resources';
import CreatingStepInitialize from './CreatingSteps/Initialize';
import StartingStepInitialize from './StartingSteps/Initialize';
import StartingStepOpenWorkspace from './StartingSteps/OpenWorkspace';
import StartingStepStartWorkspace from './StartingSteps/StartWorkspace';
import StartingStepWorkspaceConditions, {
  ConditionType,
} from './StartingSteps/WorkspaceConditions';

import styles from './index.module.css';

export type Props = MappedProps & {
  history: History;
  searchParams: URLSearchParams;
  showToastAlert: boolean;
  onTabChange: (tab: LoaderTab) => void;
};
export type State = {
  activeStep: StepId;
  alertItems: AlertItem[];
  conditions: ConditionType[];
  doneSteps: StepId[];
  factoryParams: FactoryParams;
  initialLoaderMode: LoaderMode;
};

export enum Step {
  INITIALIZE = 'initialize',
  LIMIT_CHECK = 'limit-check',
  CREATE = 'create',
  FETCH = 'fetch',
  CONFLICT_CHECK = 'conflict-check',
  APPLY = 'apply',
  START = 'start',
  OPEN = 'open',
}
type ConditionStepId = `condition-${string}`;
type StepId = Step | ConditionStepId;

class Progress extends React.PureComponent<Props, State> {
  static contextType = PF.WizardContext;
  readonly context: React.ContextType<typeof PF.WizardContext>;

  private readonly wizardRef: React.RefObject<any>;

  constructor(props: Props) {
    super(props);
    this.wizardRef = React.createRef();

    const initialLoaderMode = getLoaderMode(props.history.location);

    const factoryParams = buildFactoryParams(this.props.searchParams);

    this.state = {
      activeStep: Step.INITIALIZE,
      alertItems: [],
      conditions: [],
      doneSteps: [],
      factoryParams,
      initialLoaderMode,
    };
  }

  public componentDidMount(): void {
    this.init();
  }

  public componentDidUpdate(): void {
    this.init();
  }

  private init(): void {
    const { allWorkspaces, history } = this.props;
    const loaderMode = getLoaderMode(history.location);

    if (loaderMode.mode === 'workspace') {
      const workspace = findTargetWorkspace(allWorkspaces, loaderMode.workspaceParams);
      if (workspace && workspace.status === DevWorkspaceStatus.STARTING) {
        const conditions = (workspace.ref.status?.conditions || []).filter(
          condition => condition.message,
        ) as ConditionType[];

        const lastScore = this.scoreConditions(this.state.conditions);
        const score = this.scoreConditions(conditions);
        if (score > lastScore) {
          this.setState({
            conditions,
          });
        }
      }
    }
  }

  private scoreConditions(conditions: ConditionType[]): number {
    const typeScore = {
      Started: 1,
      DevWorkspaceResolved: 1,
      StorageReady: 1,
      RoutingReady: 1,
      ServiceAccountReady: 1,
      PullSecretsReady: 1,
      DeploymentReady: 1,
    };

    return conditions.reduce((acc, condition) => {
      if (typeScore[condition.type] !== undefined) {
        return acc + typeScore[condition.type];
      }
      return acc;
    }, 0);
  }

  private handleShowStepAlert(step: StepId, alertItem: AlertItem): void {
    if (step !== this.state.activeStep) {
      return;
    }

    const { alertItems } = this.state;
    if (alertItems.some(item => item.key === alertItem.key)) {
      return;
    }

    this.setState({
      alertItems: [...alertItems, alertItem],
    });
  }

  private handleCloseStepAlert(key: string): void {
    const { alertItems } = this.state;

    this.setState({
      alertItems: alertItems?.filter(alertItem => alertItem.key !== key),
    });
  }

  private handleGoToNextStep(step: StepId): void {
    if (step !== this.state.activeStep) {
      return;
    }

    this.wizardRef.current?.onNext();
  }

  private handleRestartFlow(step: StepId, tab?: LoaderTab): void {
    if (step !== this.state.activeStep) {
      return;
    }

    const { history } = this.props;
    const { doneSteps, initialLoaderMode } = this.state;
    const loaderMode = getLoaderMode(history.location);

    let newActiveStep: StepId;
    let newDoneSteps: StepId[];

    if (initialLoaderMode.mode === loaderMode.mode) {
      newActiveStep = Step.INITIALIZE;
      newDoneSteps = [];
    } else {
      newActiveStep = Step.START;
      newDoneSteps = doneSteps.slice(0, doneSteps.indexOf(Step.START));
    }

    this.setState({
      activeStep: newActiveStep,
      doneSteps: newDoneSteps,
      conditions: [],
    });
    this.wizardRef.current?.goToStepById(newActiveStep);

    if (tab) {
      this.props.onTabChange(tab);
    }
  }

  private getSteps(): PF.WizardStep[] {
    const { initialLoaderMode } = this.state;
    const showFactorySteps = initialLoaderMode.mode === 'factory';

    return [
      showFactorySteps ? this.getCreationInitStep() : this.getStartingInitStep(),
      ...this.getCommonSteps(),
      ...(showFactorySteps ? this.getCreationSteps() : []),
      ...this.getStartingSteps(),
    ];
  }

  private getDistance(stepId: StepId) {
    const { activeStep, doneSteps } = this.state;

    const isActive = activeStep === stepId;
    const isDone = doneSteps.includes(stepId);
    return isActive ? 0 : isDone ? 1 : -1;
  }

  private getCreationInitStep(): PF.WizardStep {
    const { history, searchParams } = this.props;

    return {
      id: Step.INITIALIZE,
      name: (
        <CreatingStepInitialize
          distance={this.getDistance(Step.INITIALIZE)}
          history={history}
          searchParams={searchParams}
          onError={alertItem => this.handleShowStepAlert(Step.INITIALIZE, alertItem)}
          onHideError={key => this.handleCloseStepAlert(key)}
          onNextStep={() => this.handleGoToNextStep(Step.INITIALIZE)}
          onRestart={tab => this.handleRestartFlow(Step.INITIALIZE, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getStartingInitStep(): PF.WizardStep {
    const { history } = this.props;

    const loaderMode = getLoaderMode(history.location);
    const matchParams = loaderMode.mode === 'workspace' ? loaderMode.workspaceParams : undefined;

    return {
      id: Step.INITIALIZE,
      name: (
        <StartingStepInitialize
          distance={this.getDistance(Step.INITIALIZE)}
          history={history}
          matchParams={matchParams}
          onError={alertItem => this.handleShowStepAlert(Step.INITIALIZE, alertItem)}
          onHideError={key => this.handleCloseStepAlert(key)}
          onNextStep={() => this.handleGoToNextStep(Step.INITIALIZE)}
          onRestart={tab => this.handleRestartFlow(Step.INITIALIZE, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getCommonSteps(): PF.WizardStep[] {
    const { history } = this.props;

    const loaderMode = getLoaderMode(history.location);
    const matchParams = loaderMode.mode === 'workspace' ? loaderMode.workspaceParams : undefined;

    return [
      {
        id: Step.LIMIT_CHECK,
        name: (
          <CommonStepCheckRunningWorkspacesLimit
            distance={this.getDistance(Step.LIMIT_CHECK)}
            history={history}
            matchParams={matchParams}
            onError={alertItem => this.handleShowStepAlert(Step.LIMIT_CHECK, alertItem)}
            onHideError={key => this.handleCloseStepAlert(key)}
            onNextStep={() => this.handleGoToNextStep(Step.LIMIT_CHECK)}
            onRestart={tab => this.handleRestartFlow(Step.LIMIT_CHECK, tab)}
          />
        ),
        component: <></>,
      },
    ];
  }

  private getCreationSteps(): PF.WizardStep[] {
    const { history, searchParams } = this.props;
    const { factoryParams } = this.state;

    const usePrebuiltResources = factoryParams.useDevworkspaceResources;

    return [
      {
        id: Step.CREATE,
        name: (
          <CreatingStepCreateWorkspace
            distance={this.getDistance(Step.CREATE)}
            history={history}
            searchParams={searchParams}
            onError={alertItem => this.handleShowStepAlert(Step.CREATE, alertItem)}
            onHideError={key => this.handleCloseStepAlert(key)}
            onNextStep={() => this.handleGoToNextStep(Step.CREATE)}
            onRestart={tab => this.handleRestartFlow(Step.CREATE, tab)}
          />
        ),
        component: <></>,
        steps: [
          usePrebuiltResources ? this.getFactoryFetchResources() : this.getFactoryFetchDevfile(),
          {
            id: Step.CONFLICT_CHECK,
            name: (
              <CreatingStepCheckExistingWorkspaces
                distance={this.getDistance(Step.CONFLICT_CHECK)}
                history={history}
                searchParams={searchParams}
                onError={alertItem => this.handleShowStepAlert(Step.CONFLICT_CHECK, alertItem)}
                onHideError={alertId => this.handleCloseStepAlert(alertId)}
                onNextStep={() => this.handleGoToNextStep(Step.CONFLICT_CHECK)}
                onRestart={tab => this.handleRestartFlow(Step.CONFLICT_CHECK, tab)}
              />
            ),
            component: <></>,
          },
          usePrebuiltResources ? this.getFactoryApplyResources() : this.getFactoryApplyDevfile(),
        ],
      },
    ];
  }

  private getFactoryFetchResources(): PF.WizardStep {
    const { history, searchParams } = this.props;

    return {
      id: Step.FETCH,
      name: (
        <CreatingStepFetchResources
          distance={this.getDistance(Step.FETCH)}
          history={history}
          searchParams={searchParams}
          onError={alertItem => this.handleShowStepAlert(Step.FETCH, alertItem)}
          onHideError={key => this.handleCloseStepAlert(key)}
          onNextStep={() => this.handleGoToNextStep(Step.FETCH)}
          onRestart={tab => this.handleRestartFlow(Step.FETCH, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getFactoryApplyResources(): PF.WizardStep {
    const { history, searchParams } = this.props;

    return {
      id: Step.APPLY,
      name: (
        <CreatingStepApplyResources
          distance={this.getDistance(Step.APPLY)}
          history={history}
          searchParams={searchParams}
          onError={alertItem => this.handleShowStepAlert(Step.APPLY, alertItem)}
          onHideError={key => this.handleCloseStepAlert(key)}
          onNextStep={() => this.handleGoToNextStep(Step.APPLY)}
          onRestart={tab => this.handleRestartFlow(Step.APPLY, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getFactoryFetchDevfile(): PF.WizardStep {
    const { history, searchParams } = this.props;

    return {
      id: Step.FETCH,
      name: (
        <CreatingStepFetchDevfile
          distance={this.getDistance(Step.FETCH)}
          history={history}
          searchParams={searchParams}
          onError={alertItem => this.handleShowStepAlert(Step.FETCH, alertItem)}
          onHideError={key => this.handleCloseStepAlert(key)}
          onNextStep={() => this.handleGoToNextStep(Step.FETCH)}
          onRestart={tab => this.handleRestartFlow(Step.FETCH, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getFactoryApplyDevfile(): PF.WizardStep {
    const { history, searchParams } = this.props;

    return {
      id: Step.APPLY,
      name: (
        <CreatingStepApplyDevfile
          distance={this.getDistance(Step.APPLY)}
          history={history}
          searchParams={searchParams}
          onError={alertItem => this.handleShowStepAlert(Step.APPLY, alertItem)}
          onHideError={key => this.handleCloseStepAlert(key)}
          onNextStep={() => this.handleGoToNextStep(Step.APPLY)}
          onRestart={tab => this.handleRestartFlow(Step.APPLY, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getStartingSteps(): PF.WizardStep[] {
    const { history } = this.props;

    const loaderMode = getLoaderMode(history.location);

    const matchParams = loaderMode.mode === 'workspace' ? loaderMode.workspaceParams : undefined;

    const conditionSteps = this.buildConditionSteps();
    const steps = conditionSteps.length > 0 ? { steps: conditionSteps } : {};

    return [
      {
        id: Step.START,
        name: (
          <StartingStepStartWorkspace
            distance={this.getDistance(Step.START)}
            onError={alertItem => this.handleShowStepAlert(Step.START, alertItem)}
            onHideError={key => this.handleCloseStepAlert(key)}
            onNextStep={() => this.handleGoToNextStep(Step.START)}
            onRestart={tab => this.handleRestartFlow(Step.START, tab)}
            history={history}
            matchParams={matchParams}
          />
        ),
        ...steps,
      },
      {
        id: Step.OPEN,
        name: (
          <StartingStepOpenWorkspace
            distance={this.getDistance(Step.OPEN)}
            onError={alertItem => this.handleShowStepAlert(Step.OPEN, alertItem)}
            onHideError={key => this.handleCloseStepAlert(key)}
            onNextStep={() => this.handleGoToNextStep(Step.OPEN)}
            onRestart={tab => this.handleRestartFlow(Step.OPEN, tab)}
            history={history}
            matchParams={matchParams}
          />
        ),
      },
    ];
  }

  private buildConditionSteps(): PF.WizardStep[] {
    const { history } = this.props;
    const { conditions } = this.state;
    const loaderMode = getLoaderMode(history.location);

    if (loaderMode.mode !== 'workspace') {
      return [];
    }

    return conditions.map(condition => {
      const stepId: ConditionStepId = `condition-${condition.type}`;
      return {
        id: stepId,
        name: (
          <StartingStepWorkspaceConditions
            distance={1}
            condition={condition as ConditionType}
            matchParams={loaderMode.workspaceParams}
            history={history}
            onError={alertItem => this.handleShowStepAlert(stepId, alertItem)}
            onHideError={key => this.handleCloseStepAlert(key)}
            onNextStep={() => this.handleGoToNextStep(stepId)}
            onRestart={tab => this.handleRestartFlow(stepId, tab)}
          />
        ),
      };
    });
  }

  private handleSwitchToNextStep(...params: Parameters<PF.WizardStepFunctionType>): void {
    const [newStep, prevStep] = params;

    const activeStep = newStep.id ? (newStep.id as Step) : this.state.activeStep;

    const doneSteps = prevStep.prevId
      ? [...this.state.doneSteps, prevStep.prevId as Step]
      : this.state.doneSteps;

    this.setState({
      activeStep,
      doneSteps,
    });
  }

  render(): React.ReactNode {
    const { showToastAlert } = this.props;
    const { alertItems } = this.state;

    const steps = this.getSteps();

    return (
      <React.Fragment>
        <ProgressAlert isToast={showToastAlert} alertItems={alertItems} />
        <PF.Wizard
          className={styles.progress}
          steps={steps}
          footer={<></>}
          ref={this.wizardRef}
          onNext={(...params) => this.handleSwitchToNextStep(...params)}
        />
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(Progress);
