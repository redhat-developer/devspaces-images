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
import { History } from 'history';
import isEqual from 'lodash/isEqual';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { ProgressAlert } from '@/components/WorkspaceProgress/Alert';
import CommonStepCheckRunningWorkspacesLimit from '@/components/WorkspaceProgress/CommonSteps/CheckRunningWorkspacesLimit';
import CreatingStepApplyDevfile from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile';
import CreatingStepApplyResources from '@/components/WorkspaceProgress/CreatingSteps/Apply/Resources';
import CreatingStepCheckExistingWorkspaces from '@/components/WorkspaceProgress/CreatingSteps/CheckExistingWorkspaces';
import CreatingStepCreateWorkspace from '@/components/WorkspaceProgress/CreatingSteps/CreateWorkspace';
import CreatingStepFetchDevfile from '@/components/WorkspaceProgress/CreatingSteps/Fetch/Devfile';
import CreatingStepFetchResources from '@/components/WorkspaceProgress/CreatingSteps/Fetch/Resources';
import CreatingStepInitialize from '@/components/WorkspaceProgress/CreatingSteps/Initialize';
import StartingStepInitialize from '@/components/WorkspaceProgress/StartingSteps/Initialize';
import StartingStepOpenWorkspace from '@/components/WorkspaceProgress/StartingSteps/OpenWorkspace';
import StartingStepStartWorkspace from '@/components/WorkspaceProgress/StartingSteps/StartWorkspace';
import StartingStepWorkspaceConditions from '@/components/WorkspaceProgress/StartingSteps/WorkspaceConditions';
import { ConditionType, isWorkspaceStatusCondition } from '@/components/WorkspaceProgress/utils';
import WorkspaceProgressWizard, {
  WorkspaceProgressWizardStep,
} from '@/components/WorkspaceProgress/Wizard';
import {
  buildFactoryParams,
  FactoryParams,
} from '@/services/helpers/factoryFlow/buildFactoryParams';
import { findTargetWorkspace } from '@/services/helpers/factoryFlow/findTargetWorkspace';
import { getLoaderMode, LoaderMode } from '@/services/helpers/factoryFlow/getLoaderMode';
import { AlertItem, DevWorkspaceStatus, LoaderTab } from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import * as WorkspaceStore from '@/store/Workspaces';
import { selectAllWorkspaces } from '@/store/Workspaces/selectors';

export type Props = MappedProps & {
  history: History;
  searchParams: URLSearchParams;
  showToastAlert: boolean;
  onTabChange: (tab: LoaderTab) => void;
};
export type State = {
  activeStepId: StepId;
  alertItems: AlertItem[];
  conditions: V1alpha2DevWorkspaceStatusConditions[];
  hasBeenStarted: boolean;
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
export type StepId = Step | ConditionStepId;

class Progress extends React.Component<Props, State> {
  private readonly wizardRef: React.RefObject<any>;

  constructor(props: Props) {
    super(props);
    this.wizardRef = React.createRef();

    const initialLoaderMode = getLoaderMode(props.history.location);

    const factoryParams = buildFactoryParams(this.props.searchParams);

    this.state = {
      activeStepId: Step.INITIALIZE,
      alertItems: [],
      conditions: [],
      hasBeenStarted: false,
      doneSteps: [],
      factoryParams,
      initialLoaderMode,
    };
  }

  public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
    if (this.state.activeStepId !== nextState.activeStepId) {
      return true;
    }

    if (isEqual(this.state.alertItems, nextState.alertItems) === false) {
      return true;
    }

    if (isEqual(this.state.conditions, nextState.conditions) === false) {
      return true;
    }

    if (isEqual(this.state.doneSteps, nextState.doneSteps) === false) {
      return true;
    }

    const workspace = this.findTargetWorkspace(this.props);
    const conditions = workspace?.ref.status?.conditions || [];
    const nextWorkspace = this.findTargetWorkspace(nextProps);
    const nextConditions = nextWorkspace?.ref.status?.conditions || [];
    if (isEqual(conditions, nextConditions) === false) {
      return true;
    }

    return false;
  }

  public componentDidMount(): void {
    this.init(this.props, this.state, undefined);
  }

  public componentDidUpdate(prevProps: Props): void {
    this.init(this.props, this.state, prevProps);
  }

  private init(props: Props, state: State, prevProps: Props | undefined): void {
    const workspace = this.findTargetWorkspace(props);
    const prevWorkspace = this.findTargetWorkspace(prevProps);

    if (
      (prevWorkspace === undefined || prevWorkspace.status !== DevWorkspaceStatus.STARTING) &&
      workspace?.status === DevWorkspaceStatus.STARTING &&
      state.activeStepId === Step.START
    ) {
      this.setState({
        hasBeenStarted: true,
      });
    }

    if (
      workspace &&
      (workspace.status === DevWorkspaceStatus.STARTING ||
        workspace.status === DevWorkspaceStatus.RUNNING ||
        workspace.status === DevWorkspaceStatus.FAILING ||
        workspace.status === DevWorkspaceStatus.FAILED)
    ) {
      const conditions = workspace.ref.status?.conditions || [];

      const lastScore = this.scoreConditions(this.state.conditions);
      const score = this.scoreConditions(conditions);
      if (
        score > lastScore ||
        (score !== 0 && score === lastScore && isEqual(this.state.conditions, conditions) === false)
      ) {
        this.setState({
          conditions,
        });
      }
    }
  }

  private findTargetWorkspace(props?: Props): Workspace | undefined {
    if (props === undefined) {
      return;
    }

    const { allWorkspaces, history } = props;
    const loaderMode = getLoaderMode(history.location);

    if (loaderMode.mode !== 'workspace') {
      return;
    }

    return findTargetWorkspace(allWorkspaces, loaderMode.workspaceParams);
  }

  private scoreConditions(conditions: V1alpha2DevWorkspaceStatusConditions[]): number {
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

  private handleStepsShowAlert(step: StepId, alertItem: AlertItem): void {
    if (step !== this.state.activeStepId) {
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

  private handleStepsGoToNext(stepId: StepId): void {
    if (stepId !== this.state.activeStepId) {
      // filter out condition steps
      return;
    }

    if (stepId !== Step.START) {
      this.wizardRef.current?.goToNext();
      return;
    }

    // because there are condition steps between `START` and `OPEN`, we need to jump over them
    const activeStepId = Step.OPEN;
    const doneSteps = [...this.state.doneSteps, stepId];
    this.setState({
      activeStepId,
      doneSteps,
    });
  }

  private handleStepsRestart(step: StepId, tab?: LoaderTab): void {
    if (step !== this.state.activeStepId) {
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
      activeStepId: newActiveStep,
      doneSteps: newDoneSteps,
      conditions: [],
      hasBeenStarted: false,
    });

    if (tab) {
      this.props.onTabChange(tab);
    }
  }

  private getSteps(): WorkspaceProgressWizardStep[] {
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
    const { activeStepId, doneSteps } = this.state;

    const isActive = activeStepId === stepId;
    const isDone = doneSteps.includes(stepId);
    return isActive ? 0 : isDone ? 1 : -1;
  }

  private getCreationInitStep(): WorkspaceProgressWizardStep {
    const { history, searchParams } = this.props;

    return {
      id: Step.INITIALIZE,
      name: (
        <CreatingStepInitialize
          distance={this.getDistance(Step.INITIALIZE)}
          hasChildren={false}
          history={history}
          searchParams={searchParams}
          onError={alertItem => this.handleStepsShowAlert(Step.INITIALIZE, alertItem)}
          onHideError={key => this.handleCloseStepAlert(key)}
          onNextStep={() => this.handleStepsGoToNext(Step.INITIALIZE)}
          onRestart={tab => this.handleStepsRestart(Step.INITIALIZE, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getStartingInitStep(): WorkspaceProgressWizardStep {
    const { history } = this.props;

    const loaderMode = getLoaderMode(history.location);
    const matchParams = loaderMode.mode === 'workspace' ? loaderMode.workspaceParams : undefined;

    return {
      id: Step.INITIALIZE,
      name: (
        <StartingStepInitialize
          distance={this.getDistance(Step.INITIALIZE)}
          hasChildren={false}
          history={history}
          matchParams={matchParams}
          onError={alertItem => this.handleStepsShowAlert(Step.INITIALIZE, alertItem)}
          onHideError={key => this.handleCloseStepAlert(key)}
          onNextStep={() => this.handleStepsGoToNext(Step.INITIALIZE)}
          onRestart={tab => this.handleStepsRestart(Step.INITIALIZE, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getCommonSteps(): WorkspaceProgressWizardStep[] {
    const { history } = this.props;

    const loaderMode = getLoaderMode(history.location);
    const matchParams = loaderMode.mode === 'workspace' ? loaderMode.workspaceParams : undefined;

    return [
      {
        id: Step.LIMIT_CHECK,
        name: (
          <CommonStepCheckRunningWorkspacesLimit
            distance={this.getDistance(Step.LIMIT_CHECK)}
            hasChildren={false}
            history={history}
            matchParams={matchParams}
            onError={alertItem => this.handleStepsShowAlert(Step.LIMIT_CHECK, alertItem)}
            onHideError={key => this.handleCloseStepAlert(key)}
            onNextStep={() => this.handleStepsGoToNext(Step.LIMIT_CHECK)}
            onRestart={tab => this.handleStepsRestart(Step.LIMIT_CHECK, tab)}
          />
        ),
        component: <></>,
      },
    ];
  }

  private getCreationSteps(): WorkspaceProgressWizardStep[] {
    const { history, searchParams } = this.props;
    const { factoryParams } = this.state;

    const usePrebuiltResources = factoryParams.useDevworkspaceResources;
    const steps = [
      usePrebuiltResources ? this.getFactoryFetchResources() : this.getFactoryFetchDevfile(),
      this.getCheckExistingWorkspacesStep(),
      usePrebuiltResources ? this.getFactoryApplyResources() : this.getFactoryApplyDevfile(),
    ];

    const areFinishedChildren = steps.every(step => step.isFinishedStep);
    const distance = areFinishedChildren ? 1 : -1;

    return [
      {
        id: Step.CREATE,
        name: (
          <CreatingStepCreateWorkspace
            distance={distance}
            hasChildren={true}
            history={history}
            searchParams={searchParams}
            onError={alertItem => this.handleStepsShowAlert(Step.CREATE, alertItem)}
            onHideError={key => this.handleCloseStepAlert(key)}
            onNextStep={() => this.handleStepsGoToNext(Step.CREATE)}
            onRestart={tab => this.handleStepsRestart(Step.CREATE, tab)}
          />
        ),
        component: <></>,
        steps,
      },
    ];
  }

  private getCheckExistingWorkspacesStep(): WorkspaceProgressWizardStep {
    const { history, searchParams } = this.props;
    const distance = this.getDistance(Step.CONFLICT_CHECK);

    return {
      id: Step.CONFLICT_CHECK,
      isFinishedStep: distance === 1,
      name: (
        <CreatingStepCheckExistingWorkspaces
          distance={distance}
          hasChildren={false}
          history={history}
          searchParams={searchParams}
          onError={alertItem => this.handleStepsShowAlert(Step.CONFLICT_CHECK, alertItem)}
          onHideError={alertId => this.handleCloseStepAlert(alertId)}
          onNextStep={() => this.handleStepsGoToNext(Step.CONFLICT_CHECK)}
          onRestart={tab => this.handleStepsRestart(Step.CONFLICT_CHECK, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getFactoryFetchResources(): WorkspaceProgressWizardStep {
    const { history, searchParams } = this.props;
    const distance = this.getDistance(Step.FETCH);

    return {
      id: Step.FETCH,
      isFinishedStep: distance === 1,
      name: (
        <CreatingStepFetchResources
          distance={distance}
          hasChildren={false}
          history={history}
          searchParams={searchParams}
          onError={alertItem => this.handleStepsShowAlert(Step.FETCH, alertItem)}
          onHideError={key => this.handleCloseStepAlert(key)}
          onNextStep={() => this.handleStepsGoToNext(Step.FETCH)}
          onRestart={tab => this.handleStepsRestart(Step.FETCH, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getFactoryApplyResources(): WorkspaceProgressWizardStep {
    const { history, searchParams } = this.props;
    const distance = this.getDistance(Step.APPLY);

    return {
      id: Step.APPLY,
      isFinishedStep: distance === 1,
      name: (
        <CreatingStepApplyResources
          distance={distance}
          hasChildren={false}
          history={history}
          searchParams={searchParams}
          onError={alertItem => this.handleStepsShowAlert(Step.APPLY, alertItem)}
          onHideError={key => this.handleCloseStepAlert(key)}
          onNextStep={() => this.handleStepsGoToNext(Step.APPLY)}
          onRestart={tab => this.handleStepsRestart(Step.APPLY, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getFactoryFetchDevfile(): WorkspaceProgressWizardStep {
    const { history, searchParams } = this.props;
    const distance = this.getDistance(Step.FETCH);

    return {
      id: Step.FETCH,
      isFinishedStep: distance === 1,
      name: (
        <CreatingStepFetchDevfile
          distance={distance}
          hasChildren={false}
          history={history}
          searchParams={searchParams}
          onError={alertItem => this.handleStepsShowAlert(Step.FETCH, alertItem)}
          onHideError={key => this.handleCloseStepAlert(key)}
          onNextStep={() => this.handleStepsGoToNext(Step.FETCH)}
          onRestart={tab => this.handleStepsRestart(Step.FETCH, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getFactoryApplyDevfile(): WorkspaceProgressWizardStep {
    const { history, searchParams } = this.props;
    const distance = this.getDistance(Step.APPLY);

    return {
      id: Step.APPLY,
      isFinishedStep: distance === 1,
      name: (
        <CreatingStepApplyDevfile
          distance={distance}
          hasChildren={false}
          history={history}
          searchParams={searchParams}
          onError={alertItem => this.handleStepsShowAlert(Step.APPLY, alertItem)}
          onHideError={key => this.handleCloseStepAlert(key)}
          onNextStep={() => this.handleStepsGoToNext(Step.APPLY)}
          onRestart={tab => this.handleStepsRestart(Step.APPLY, tab)}
        />
      ),
      component: <></>,
    };
  }

  private getStartingSteps(): WorkspaceProgressWizardStep[] {
    const { history } = this.props;

    const loaderMode = getLoaderMode(history.location);

    const matchParams = loaderMode.mode === 'workspace' ? loaderMode.workspaceParams : undefined;

    // hide spinner near this (parent) step
    const showChildren = this.state.hasBeenStarted;

    // this (parent) step cannot be active if it contains child steps
    // we need this step to be activated and start workspace and only then allow to appear condition steps
    const conditionSteps = showChildren ? this.buildConditionSteps() : [];
    const steps = conditionSteps.length > 0 ? { steps: conditionSteps } : {};

    return [
      {
        id: Step.START,
        name: (
          <StartingStepStartWorkspace
            distance={this.getDistance(Step.START)}
            hasChildren={showChildren}
            onError={alertItem => this.handleStepsShowAlert(Step.START, alertItem)}
            onHideError={key => this.handleCloseStepAlert(key)}
            onNextStep={() => this.handleStepsGoToNext(Step.START)}
            onRestart={tab => this.handleStepsRestart(Step.START, tab)}
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
            hasChildren={false}
            onError={alertItem => this.handleStepsShowAlert(Step.OPEN, alertItem)}
            onHideError={key => this.handleCloseStepAlert(key)}
            onNextStep={() => this.handleStepsGoToNext(Step.OPEN)}
            onRestart={tab => this.handleStepsRestart(Step.OPEN, tab)}
            history={history}
            matchParams={matchParams}
          />
        ),
      },
    ];
  }

  private buildConditionSteps(): WorkspaceProgressWizardStep[] {
    const { history } = this.props;
    const { conditions } = this.state;
    const loaderMode = getLoaderMode(history.location);

    if (loaderMode.mode !== 'workspace') {
      return [];
    }

    // Children steps get hidden when all of them are finished. This usually
    // happens in the middle of a devWorkspace starting flow and makes
    // the condition sub-steps to flicker. The fix is to wait until
    // the condition of type 'Ready' is done and only then set all
    // condition steps as finished.
    const areFinishedSteps = conditions.some(
      condition => condition.type === 'Ready' && condition.status === 'True',
    );

    const workspaceStartFailed = conditions.some(condition => condition.reason !== undefined);

    return conditions
      .filter((condition): condition is ConditionType => isWorkspaceStatusCondition(condition))
      .filter(condition => {
        // show only condition with the failure description
        return workspaceStartFailed ? condition.status === 'True' : true;
      })
      .map(condition => {
        const stepId: ConditionStepId = `condition-${condition.type}`;
        const distance = condition.status === 'True' ? 1 : 0;

        return {
          id: stepId,
          isFinishedStep: areFinishedSteps,
          name: (
            <StartingStepWorkspaceConditions
              distance={distance}
              hasChildren={false}
              condition={condition}
              matchParams={loaderMode.workspaceParams}
              history={history}
              onError={alertItem => this.handleStepsShowAlert(stepId, alertItem)}
              onHideError={key => this.handleCloseStepAlert(key)}
              onNextStep={() => this.handleStepsGoToNext(stepId)}
              onRestart={tab => this.handleStepsRestart(stepId, tab)}
            />
          ),
        };
      });
  }

  private handleSwitchToNextStep(nextStepId: StepId | undefined, prevStepId: StepId): void {
    const activeStepId = nextStepId || this.state.activeStepId;
    const doneSteps = [...this.state.doneSteps, prevStepId];

    this.setState({
      activeStepId,
      doneSteps,
    });
  }

  render(): React.ReactNode {
    const { showToastAlert } = this.props;
    const { alertItems, activeStepId: activeStep } = this.state;

    const steps = this.getSteps();

    return (
      <React.Fragment>
        <ProgressAlert isToast={showToastAlert} alertItems={alertItems} />
        <WorkspaceProgressWizard
          ref={this.wizardRef}
          activeStepId={activeStep}
          steps={steps}
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
