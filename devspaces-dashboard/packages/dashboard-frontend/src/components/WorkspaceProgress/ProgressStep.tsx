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

import { MIN_STEP_DURATION_MS } from '@/components/WorkspaceProgress/const';
import { Debounce } from '@/services/helpers/debounce';
import { DisposableCollection } from '@/services/helpers/disposable';
import { AlertItem, LoaderTab } from '@/services/helpers/types';

export type ProgressStepProps = {
  distance: -1 | 0 | 1 | undefined;
  hasChildren: boolean;
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
  protected readonly toDispose: DisposableCollection;

  protected abstract readonly name: string;
  protected abstract runStep(): Promise<boolean>;
  protected abstract buildAlertItem(error: Error): AlertItem;

  private readonly debounce: Debounce;
  private readonly callback = async () => {
    try {
      const jumpToNextStep = await this.runStep();
      if (jumpToNextStep) {
        this.props.onNextStep();
      }
    } catch (e) {
      this.handleError(e);
    }
  };

  protected constructor(props) {
    super(props);

    this.debounce = new Debounce();
    this.toDispose = new DisposableCollection();
    this.toDispose.push({
      dispose: () => {
        this.debounce.unsubscribe(this.callback);
      },
    });
  }

  protected prepareAndRun(): void {
    this.debounce.subscribe(this.callback);
    this.debounce.execute(MIN_STEP_DURATION_MS);
  }

  protected handleError(e: unknown) {
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
