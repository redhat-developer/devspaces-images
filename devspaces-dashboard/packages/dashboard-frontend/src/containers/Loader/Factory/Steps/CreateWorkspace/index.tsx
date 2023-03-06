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

import { helpers } from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import React from 'react';
import { LoaderPage } from '../../../../../pages/Loader';
import { delay } from '../../../../../services/helpers/delay';
import { DisposableCollection } from '../../../../../services/helpers/disposable';
import { AlertItem } from '../../../../../services/helpers/types';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../../AbstractStep';
import { buildFactoryParams, FactoryParams } from '../../../buildFactoryParams';
import { MIN_STEP_DURATION_MS } from '../../../const';

export type Props = LoaderStepProps & {
  searchParams: URLSearchParams;
};
export type State = LoaderStepState & {
  factoryParams: FactoryParams;
};

export default class StepCreateWorkspace extends AbstractLoaderStep<Props, State> {
  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
    };
  }

  public componentDidMount() {
    this.prepareAndRun();
  }

  public componentDidUpdate() {
    this.prepareAndRun();
  }

  protected handleRestart(): void {
    this.clearStepError();
    this.props.onRestart();
  }

  protected async runStep(): Promise<boolean> {
    await delay(MIN_STEP_DURATION_MS);
    return true;
  }

  private getAlertItem(error: unknown): AlertItem | undefined {
    if (!error) {
      return;
    }
    return {
      key: 'factory-loader-initialize',
      title: 'Failed to create the workspace',
      variant: AlertVariant.danger,
      children: helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Click to try again',
          callback: () => this.handleRestart(),
        },
      ],
    };
  }

  render(): React.ReactElement {
    const { currentStepIndex, loaderSteps, tabParam } = this.props;
    const { lastError } = this.state;

    const steps = loaderSteps.values;
    const currentStepId = loaderSteps.get(currentStepIndex).value.id;

    const alertItem = this.getAlertItem(lastError);

    return (
      <LoaderPage
        alertItem={alertItem}
        currentStepId={currentStepId}
        steps={steps}
        tabParam={tabParam}
        workspace={undefined}
        onTabChange={tab => this.handleTabChange(tab)}
      />
    );
  }
}
