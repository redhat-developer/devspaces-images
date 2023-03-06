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

import { History } from 'history';
import React from 'react';
import { Cancellation, pseudoCancellable } from 'real-cancellable-promise';
import { List, LoaderStep } from '../../components/Loader/Step';
import { DisposableCollection } from '../../services/helpers/disposable';

export type LoaderStepProps = {
  currentStepIndex: number;
  history: History;
  loaderSteps: Readonly<List<LoaderStep>>;
  tabParam: string | undefined;
  onNextStep: () => void;
  onRestart: (tabName?: string) => void;
  onTabChange: (tab: string) => void;
};
export type LoaderStepState = {
  lastError?: unknown;
};

export abstract class AbstractLoaderStep<
  P extends LoaderStepProps,
  S extends LoaderStepState,
> extends React.Component<P, S> {
  protected abstract readonly toDispose: DisposableCollection;

  protected abstract runStep(): Promise<boolean>;
  protected abstract handleRestart(): void;

  protected async prepareAndRun(): Promise<void> {
    try {
      const stepCancellablePromise = pseudoCancellable(this.runStep());
      this.toDispose.push({
        dispose: () => {
          stepCancellablePromise.cancel();
        },
      });
      const jumpToNextStep = await stepCancellablePromise;
      if (jumpToNextStep) {
        this.props.onNextStep();
      }
    } catch (e) {
      if (e instanceof Cancellation) {
        // component updated, do nothing
        return;
      }
      this.setStepError(e);
    }
  }

  protected setStepError(e: unknown) {
    const { currentStepIndex, loaderSteps } = this.props;
    const currentStep = loaderSteps.get(currentStepIndex).value;

    currentStep.hasError = true;
    this.setState({
      lastError: e,
    });
  }

  protected clearStepError() {
    const { currentStepIndex, loaderSteps } = this.props;
    const currentStep = loaderSteps.get(currentStepIndex).value;

    currentStep.hasError = false;
    this.setState({
      lastError: undefined,
    });
  }

  protected async waitForStepDone(seconds: number): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject();
      }, seconds * 1000);

      this.toDispose.push({
        dispose: () => {
          window.clearTimeout(timeoutId);
          resolve();
        },
      });
    });
  }

  protected handleTabChange(tab: string): void {
    this.props.onTabChange(tab);
  }
}
