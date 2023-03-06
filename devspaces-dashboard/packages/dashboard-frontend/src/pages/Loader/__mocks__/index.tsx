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
import { LoaderTab } from '../../../services/helpers/types';

export class LoaderPage extends React.PureComponent<Props> {
  render(): React.ReactNode {
    const { alertItem, currentStepId, steps, tabParam, onTabChange } = this.props;
    const wizardSteps = steps.map(step => (
      <div key={step.id} data-testid={step.id}>
        <div data-testid="hasError">{step.hasError ? 'true' : 'false'}</div>
        <div data-testid="id">{step.id}</div>
        <div data-testid="title">{step.title}</div>
      </div>
    ));
    const actions = alertItem?.actionCallbacks?.map(actionCallback => (
      <div key={actionCallback.title} data-testid="action-callback">
        <button onClick={() => actionCallback.callback()}>{actionCallback.title}</button>
      </div>
    ));
    return (
      <div data-testid="common-loader-page">
        <button
          data-testid="tab-progress"
          onClick={() => onTabChange(LoaderTab[LoaderTab.Progress])}
        >
          Progress
        </button>
        <button data-testid="tab-logs" onClick={() => onTabChange(LoaderTab[LoaderTab.Logs])}>
          Logs
        </button>
        <div data-testid="active-tab-key">{tabParam}</div>
        <div data-testid="current-step-id">{currentStepId}</div>
        <div data-testid="alert">
          <span data-testid="alert-title">{alertItem?.title}</span>
          <span data-testid="alert-body">{alertItem?.children}</span>
        </div>
        <div data-testid="action-links">{actions}</div>
        <div data-testid="wizard-steps">{wizardSteps}</div>
      </div>
    );
  }
}
