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

import { Step, StepId } from '@/components/WorkspaceProgress';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import WorkspaceProgressWizard, { WorkspaceProgressWizardStep } from '..';

const mockGoToNext = jest.fn();

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('WorkspaceProgressWizard', () => {
  let steps: WorkspaceProgressWizardStep[];
  let ref: React.RefObject<any>;

  beforeEach(() => {
    steps = [
      {
        id: Step.INITIALIZE,
        name: Step.INITIALIZE,
        component: <></>,
      },
      {
        id: Step.LIMIT_CHECK,
        name: Step.LIMIT_CHECK,
        component: <></>,
      },
      {
        id: Step.CREATE,
        name: Step.CREATE,
        component: <></>,
        steps: [
          {
            id: Step.FETCH,
            name: Step.FETCH,
            component: <></>,
          },
          {
            id: Step.CONFLICT_CHECK,
            name: Step.CONFLICT_CHECK,
            component: <></>,
          },
          {
            id: Step.APPLY,
            name: Step.APPLY,
            component: <></>,
          },
        ],
      },
    ];
    ref = React.createRef();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('component snapshot', () => {
    const activeStepId: StepId = Step.LIMIT_CHECK;

    const snapshot = createSnapshot(activeStepId, steps, ref);
    expect(snapshot).toMatchSnapshot();
  });

  test('switching active step', () => {
    const activeStepId: StepId = Step.INITIALIZE;

    const { reRenderComponent } = renderComponent(activeStepId, steps, ref);

    const buttonInitialize = screen.getByRole('button', { name: Step.INITIALIZE });
    const buttonLimitCheck = screen.getByRole('button', { name: Step.LIMIT_CHECK });

    expect(buttonInitialize.className.split(' ')).toEqual(expect.arrayContaining(['pf-m-current']));
    expect(buttonLimitCheck.className.split(' ')).not.toEqual(
      expect.arrayContaining(['pf-m-current']),
    );

    const nextActiveStepId = Step.LIMIT_CHECK;
    reRenderComponent(nextActiveStepId, steps, ref);

    const nextButtonInitialize = screen.getByRole('button', { name: Step.INITIALIZE });
    const nextButtonLimitCheck = screen.getByRole('button', { name: Step.LIMIT_CHECK });

    expect(nextButtonInitialize.className.split(' ')).not.toEqual(
      expect.arrayContaining(['pf-m-current']),
    );
    expect(nextButtonLimitCheck.className.split(' ')).toEqual(
      expect.arrayContaining(['pf-m-current']),
    );
  });

  describe('trigger goToNext using reference', () => {
    test('on the very first step', () => {
      const activeStepId: StepId = Step.INITIALIZE;

      renderComponent(activeStepId, steps, ref);

      expect(mockGoToNext).not.toHaveBeenCalled();

      ref.current?.goToNext();

      expect(mockGoToNext).toHaveBeenCalledWith(Step.LIMIT_CHECK, Step.INITIALIZE);
    });

    test('on the very last step', () => {
      const activeStepId: StepId = Step.APPLY;

      renderComponent(activeStepId, steps, ref);

      expect(mockGoToNext).not.toHaveBeenCalled();

      ref.current?.goToNext();

      expect(mockGoToNext).toHaveBeenCalledWith(undefined, Step.APPLY);
    });
  });
});

function getComponent(
  activeStepId: StepId,
  steps: WorkspaceProgressWizardStep[],
  ref: React.RefObject<any>,
): React.ReactElement {
  return (
    <WorkspaceProgressWizard
      ref={ref}
      activeStepId={activeStepId}
      steps={steps}
      onNext={mockGoToNext}
    />
  );
}
