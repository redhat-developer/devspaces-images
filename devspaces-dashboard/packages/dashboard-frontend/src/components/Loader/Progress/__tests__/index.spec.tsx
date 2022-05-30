/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import { IdeLoaderSteps } from '../../Step';
import { buildIdeLoaderSteps } from '../../Step/buildSteps';
import { LoaderProgress } from '..';
import { WizardStep } from '@patternfly/react-core';

describe('Loader Progress', () => {
  describe('Step INITIALIZATION', () => {
    const currentStepId = IdeLoaderSteps.INITIALIZING;
    let wizardSteps: WizardStep[];

    beforeEach(() => {
      wizardSteps = buildIdeLoaderSteps().values.map(v => v.toWizardStep(currentStepId));
    });

    test('snapshot', () => {
      const snapshot = createSnapshot(currentStepId, wizardSteps);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });
  });
});

function getComponent(
  currentStepId: IdeLoaderSteps,
  wizardSteps: WizardStep[],
): React.ReactElement {
  return <LoaderProgress steps={wizardSteps} currentStepId={currentStepId} />;
}

function createSnapshot(...args: Parameters<typeof getComponent>): ReactTestRenderer {
  return renderer.create(getComponent(...args));
}
