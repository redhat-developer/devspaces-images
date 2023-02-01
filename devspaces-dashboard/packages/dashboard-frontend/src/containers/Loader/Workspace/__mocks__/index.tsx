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
import { Props } from '..';
import { LoadingStep } from '../../../../components/Loader/Step';

export default class WorkspaceLoader extends React.Component<Props> {
  render(): React.ReactNode {
    const { currentStepIndex, loaderSteps, onNextStep, onRestart } = this.props;
    const steps = loaderSteps.values.map(step => (
      <div key={LoadingStep[step.id]} data-testid={LoadingStep[step.id]}>
        {LoadingStep[step.id]}
      </div>
    ));
    return (
      <div data-testid="ide-loader-container">
        <button data-testid="on-next-step" onClick={() => onNextStep()}>
          onNextStep
        </button>
        <button data-testid="on-restart" onClick={() => onRestart()}>
          onRestart
        </button>
        <div data-testid="current-step-index">{currentStepIndex}</div>
        <div>{steps}</div>
      </div>
    );
  }
}
