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
import wizardStyles from '@patternfly/react-styles/css/components/Wizard/wizard';
import React from 'react';

import styles from '@/components/WorkspaceProgress/Wizard/index.module.css';

import { StepId } from '..';

export interface WorkspaceProgressWizardStep extends PF.WizardStep {
  id: StepId;
  steps?: WorkspaceProgressWizardStep[];
}

export type Props = {
  activeStepId: StepId;
  steps: WorkspaceProgressWizardStep[];
  onNext: (nextStepId: StepId | undefined, prevStepId: StepId) => void;
};

class WorkspaceProgressWizard extends React.Component<Props> {
  private handleGoToStepById() {
    console.warn('Not implemented: handleGoToStepById');
    return false;
  }

  private handleGoToStepByName() {
    console.warn('Not implemented: handleGoToStepByName');
    return false;
  }

  private handleBack() {
    console.warn('Not implemented: handleBack');
    return false;
  }

  private handleClose() {
    console.warn('Not implemented: handleClose');
    return false;
  }

  public goToNext(): void {
    const flattenedSteps = this.flattenSteps(this.props.steps);
    // find the index of the next after the current active step
    const activeStepNumber = this.getFlattenedStepsNumber(flattenedSteps, this.props.activeStepId);

    if (activeStepNumber === 0) {
      // current step is not found by its id, do nothing
      return;
    }

    if (activeStepNumber === flattenedSteps.length) {
      // last step
      this.props.onNext(undefined, this.props.activeStepId);
      return;
    }

    const nextStep = flattenedSteps[activeStepNumber];
    this.props.onNext(nextStep.id, this.props.activeStepId);
  }

  private handleNavToggle() {
    console.warn('Not implemented: handleNavToggle');
    return false;
  }

  private setDefaultValues(steps: WorkspaceProgressWizardStep[]): WorkspaceProgressWizardStep[] {
    const withDefaults = (step: WorkspaceProgressWizardStep) =>
      Object.assign({ canJumpTo: true }, step);

    return steps.map(step => {
      const subSteps = step.steps;
      if (subSteps !== undefined) {
        subSteps.map(subStep => withDefaults(subStep));
      }
      return withDefaults(step);
    });
  }

  private flattenSteps(steps: WorkspaceProgressWizardStep[]): WorkspaceProgressWizardStep[] {
    return steps.reduce((acc, step) => {
      if (step.steps) {
        return acc.concat(step.steps);
      }
      return acc.concat(step);
    }, [] as WorkspaceProgressWizardStep[]);
  }

  /**
   * Returns the number (index + 1) of the step in the flattened steps array
   */
  private getFlattenedStepsNumber(
    flattenedSteps: WorkspaceProgressWizardStep[],
    stepId: StepId,
  ): number {
    return flattenedSteps.findIndex(step => step.id === stepId) + 1;
  }

  private buildWizardNav(
    activeStepId: StepId,
    steps: WorkspaceProgressWizardStep[],
  ): React.ReactElement {
    const stepsWithDefaults = this.setDefaultValues(steps);
    const flattenedSteps = this.flattenSteps(stepsWithDefaults);

    return (
      <PF.WizardNav aria-label="Workspace Progress Steps" isOpen={true}>
        {stepsWithDefaults.map(step => {
          const { canJumpTo, name, steps = [], id } = step;
          const flattenedStepNumber = this.getFlattenedStepsNumber(flattenedSteps, id);

          const hasChildren = steps.length !== 0;
          const allChildrenFinished = steps.every(subStep => subStep.isFinishedStep);
          const showChildren = hasChildren && allChildrenFinished === false;

          const hasActiveChild = steps.some(subStep => subStep.id === activeStepId);

          return (
            <PF.WizardNavItem
              key={id}
              content={name}
              step={flattenedStepNumber}
              isCurrent={activeStepId === id || hasActiveChild}
              isDisabled={!canJumpTo}
              onNavItemClick={() => this.handleGoToStepById()}
            >
              {showChildren && (
                <PF.WizardNav returnList>
                  {steps.map(subStep => {
                    const { canJumpTo, name, id } = subStep;
                    const flattenedStepNumber = this.getFlattenedStepsNumber(flattenedSteps, id);
                    return (
                      <PF.WizardNavItem
                        key={id}
                        content={name}
                        step={flattenedStepNumber}
                        isCurrent={activeStepId === id}
                        isDisabled={!canJumpTo}
                        onNavItemClick={() => this.handleGoToStepById()}
                      />
                    );
                  })}
                </PF.WizardNav>
              )}
            </PF.WizardNavItem>
          );
        })}
      </PF.WizardNav>
    );
  }

  render() {
    const { activeStepId, steps } = this.props;

    const hasNoBodyPadding = false;

    const activeStep = steps[0];

    return (
      <PF.WizardContextProvider
        value={{
          activeStep: activeStep,
          goToStepById: () => this.handleGoToStepById(),
          goToStepByName: () => this.handleGoToStepByName(),
          onBack: () => this.handleBack(),
          onClose: () => this.handleClose(),
          onNext: () => this.goToNext(),
        }}
      >
        <div className={`${styles.progress} ${wizardStyles.wizard}`}>
          <PF.WizardToggle
            activeStep={activeStep}
            hasNoBodyPadding={hasNoBodyPadding}
            isNavOpen={true}
            nav={() => this.buildWizardNav(activeStepId, steps)}
            onNavToggle={() => this.handleNavToggle()}
            steps={[]}
          >
            <React.Fragment />
          </PF.WizardToggle>
        </div>
      </PF.WizardContextProvider>
    );
  }
}

export default React.forwardRef<WorkspaceProgressWizard, Props>((props, ref) => (
  <WorkspaceProgressWizard ref={ref} {...props} />
));
