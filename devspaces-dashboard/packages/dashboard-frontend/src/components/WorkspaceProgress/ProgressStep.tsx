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
import { History } from 'history';
import React from 'react';
import { Cancellation, pseudoCancellable } from 'real-cancellable-promise';
import { DisposableCollection } from '../../services/helpers/disposable';
import { AlertItem, LoaderTab } from '../../services/helpers/types';

export type ProgressStepProps = {
  distance: -1 | 0 | 1 | undefined;
  history: History;
  onError: (alertItem: AlertItem) => void;
  onHideError: (key: string) => void;
  onNextStep: () => void;
  onRestart: (tabName?: LoaderTab) => void;
};
export type ProgressStepState = {
  name: string;
  lastError?: unknown;
};

export abstract class ProgressStep<
  P extends ProgressStepProps,
  S extends ProgressStepState,
> extends React.Component<P, S> {
  protected readonly toDispose = new DisposableCollection();

  protected abstract readonly name: string;
  protected abstract runStep(): Promise<boolean>;
  protected abstract buildAlertItem(error: Error): AlertItem;

  protected async prepareAndRun(): Promise<void> {
    try {
      const stepCancellablePromise = pseudoCancellable(this.runStep());
      this.toDispose.push({
        dispose: () => {
          stepCancellablePromise.cancel();
        },
      });
      const jumpToNextStep = await stepCancellablePromise;
      if (jumpToNextStep === true) {
        this.props.onNextStep();
      }
    } catch (e) {
      this.handleError(e);
    }
  }

  protected handleError(e: unknown) {
    if (e instanceof Cancellation) {
      // component updated, do nothing
      return;
    }

    const error: Error = e instanceof Error ? e : new Error(helpers.errors.getMessage(e));

    this.setState({
      lastError: error,
    });
    const alertItem = this.buildAlertItem(error);
    this.props.onError(alertItem);
  }

  protected clearStepError() {
    this.setState({
      lastError: undefined,
    });
  }
}
