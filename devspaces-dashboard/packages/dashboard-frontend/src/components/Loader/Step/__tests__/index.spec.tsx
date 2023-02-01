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

import React from 'react';
import { WizardStep } from '@patternfly/react-core';
import { render, RenderResult, screen } from '@testing-library/react';
import renderer, { ReactTestRenderer } from 'react-test-renderer';
import { LoadingStep, LoaderStep } from '..';

import styles from '../index.module.css';

describe('Loader step', () => {
  describe('disabled step', () => {
    let wizardStep: WizardStep;

    beforeEach(() => {
      const step = new LoaderStep(LoadingStep.START_WORKSPACE);

      wizardStep = LoaderStep.toWizardSteps(LoadingStep.INITIALIZE, [step])[0];
    });

    test('SNAPSHOT', () => {
      const snapshot = createSnapshot(wizardStep.name);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('title', () => {
      renderComponent(wizardStep.name);

      const stepTitle = screen.getByTestId('step-title');
      expect(stepTitle.classList.contains(styles.error)).toEqual(false);
      expect(stepTitle.classList.contains(styles.progress)).toEqual(false);
    });

    test('icon', () => {
      renderComponent(wizardStep.name);

      const stepDoneIcon = screen.queryByTestId('step-done-icon');
      expect(stepDoneIcon).toBeNull();

      const stepFailedIcon = screen.queryByTestId('step-failed-icon');
      expect(stepFailedIcon).toBeNull();

      const stepInProgressIcon = screen.queryByTestId('step-in-progress-icon');
      expect(stepInProgressIcon).toBeNull();
    });
  });

  describe('active step', () => {
    describe('in progress', () => {
      let wizardStep: WizardStep;

      beforeEach(() => {
        const step = new LoaderStep(LoadingStep.START_WORKSPACE);

        wizardStep = LoaderStep.toWizardSteps(LoadingStep.START_WORKSPACE, [step])[0];
      });

      test('SNAPSHOT', () => {
        const snapshot = createSnapshot(wizardStep.name);
        expect(snapshot.toJSON()).toMatchSnapshot();
      });

      test('title', () => {
        renderComponent(wizardStep.name);

        const stepTitle = screen.getByTestId('step-title');
        expect(stepTitle.classList.contains(styles.error)).toEqual(false);
        expect(stepTitle.classList.contains(styles.progress)).toEqual(true);
      });

      test('icon', () => {
        renderComponent(wizardStep.name);

        const stepDoneIcon = screen.queryByTestId('step-done-icon');
        expect(stepDoneIcon).toBeNull();

        const stepFailedIcon = screen.queryByTestId('step-failed-icon');
        expect(stepFailedIcon).toBeNull();

        const stepInProgressIcon = screen.queryByTestId('step-in-progress-icon');
        expect(stepInProgressIcon).not.toBeNull();
      });
    });

    describe('failed', () => {
      let wizardStep: WizardStep;

      beforeEach(() => {
        const step = new LoaderStep(LoadingStep.START_WORKSPACE);
        step.hasError = true;

        wizardStep = LoaderStep.toWizardSteps(LoadingStep.START_WORKSPACE, [step])[0];
      });

      test('SNAPSHOT', () => {
        const snapshot = createSnapshot(wizardStep.name);
        expect(snapshot.toJSON()).toMatchSnapshot();
      });

      test('title', () => {
        renderComponent(wizardStep.name);

        const stepTitle = screen.getByTestId('step-title');
        expect(stepTitle.classList.contains(styles.error)).toEqual(true);
        expect(stepTitle.classList.contains(styles.progress)).toEqual(false);
      });

      test('icon', () => {
        renderComponent(wizardStep.name);

        const stepDoneIcon = screen.queryByTestId('step-done-icon');
        expect(stepDoneIcon).toBeNull();

        const stepFailedIcon = screen.queryByTestId('step-failed-icon');
        expect(stepFailedIcon).not.toBeNull();

        const stepInProgressIcon = screen.queryByTestId('step-in-progress-icon');
        expect(stepInProgressIcon).toBeNull();
      });
    });
  });

  describe('finished step', () => {
    let wizardStep: WizardStep;

    beforeEach(() => {
      const step = new LoaderStep(LoadingStep.START_WORKSPACE);

      wizardStep = LoaderStep.toWizardSteps(LoadingStep.OPEN_WORKSPACE, [step])[0];
    });

    test('SNAPSHOT', () => {
      const snapshot = createSnapshot(wizardStep.name);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('title', () => {
      renderComponent(wizardStep.name);

      const stepTitle = screen.getByTestId('step-title');
      expect(stepTitle.classList.contains(styles.error)).toEqual(false);
      expect(stepTitle.classList.contains(styles.progress)).toEqual(false);
    });

    test('icon', () => {
      renderComponent(wizardStep.name);

      const stepDoneIcon = screen.queryByTestId('step-done-icon');
      expect(stepDoneIcon).not.toBeNull();

      const stepFailedIcon = screen.queryByTestId('step-failed-icon');
      expect(stepFailedIcon).toBeNull();

      const stepInProgressIcon = screen.queryByTestId('step-in-progress-icon');
      expect(stepInProgressIcon).toBeNull();
    });
  });
});

function renderComponent(step: React.ReactNode): RenderResult {
  return render(<React.Fragment>{step}</React.Fragment>);
}

function createSnapshot(step: React.ReactNode): ReactTestRenderer {
  return renderer.create(<React.Fragment>{step}</React.Fragment>);
}
