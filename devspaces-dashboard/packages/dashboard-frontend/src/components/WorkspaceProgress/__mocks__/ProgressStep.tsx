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

import { AlertVariant } from '@patternfly/react-core';
import React from 'react';

import { ProgressStepProps, ProgressStepState } from '@/components/WorkspaceProgress/ProgressStep';
import { AlertItem } from '@/services/helpers/types';

export class ProgressStep extends React.Component<ProgressStepProps, ProgressStepState> {
  protected readonly name: string;

  public render() {
    const { distance, onError, onNextStep, onRestart } = this.props;
    const alertItem: AlertItem = {
      title: 'Error',
      key: 'error',
      variant: AlertVariant.danger,
      children: `Error in step ${this.name}`,
    };
    return (
      <div data-testid="progress-step">
        <span data-testid="step-distance">{distance}</span>
        <span data-testid="step-name">{this.name}</span>
        <input
          onClick={() => onError(alertItem)}
          data-testid="onError"
          name="onError"
          type="button"
          value="onError"
        />
        <input
          onClick={() => onRestart()}
          data-testid="onRestart"
          name="onRestart"
          type="button"
          value="onRestart"
        />
        <input
          onClick={() => onNextStep()}
          data-testid="onNextStep"
          name=" onNextStep"
          type="button"
          value="onNextStep"
        />
      </div>
    );
  }
}
