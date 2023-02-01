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
import renderer, { ReactTestRenderer } from 'react-test-renderer';
import { WizardStep } from '@patternfly/react-core';
import { LoaderStep, LoadingStep } from '../../Step';
import { buildLoaderSteps, getWorkspaceLoadingSteps } from '../../Step/buildSteps';
import { LoaderProgress } from '..';

describe('Loader Progress', () => {
  describe('Step INITIALIZATION', () => {
    const currentStepId = LoadingStep.INITIALIZE;
    let wizardSteps: WizardStep[];

    beforeEach(() => {
      const loadingSteps = getWorkspaceLoadingSteps();
      const steps = buildLoaderSteps(loadingSteps).values;
      wizardSteps = LoaderStep.toWizardSteps(currentStepId, steps);
    });

    test('snapshot', () => {
      const snapshot = createSnapshot(currentStepId, wizardSteps);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });
  });
});

function getComponent(currentStepId: LoadingStep, wizardSteps: WizardStep[]): React.ReactElement {
  return <LoaderProgress steps={wizardSteps} currentStepId={currentStepId} />;
}

function createSnapshot(...args: Parameters<typeof getComponent>): ReactTestRenderer {
  return renderer.create(getComponent(...args));
}
