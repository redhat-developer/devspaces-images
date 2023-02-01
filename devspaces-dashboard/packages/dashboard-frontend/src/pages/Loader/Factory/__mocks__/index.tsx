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
import { Props, State } from '..';

export class FactoryLoaderPage extends React.PureComponent<Props, State> {
  render(): React.ReactNode {
    const { alertItem, currentStepId, steps } = this.props;
    const wizardSteps = steps.map(step => (
      <div key={step.id} data-testid={step.id}>
        <div data-testid="hasError">{step.hasError ? 'true' : 'false'}</div>
        <div data-testid="id">{step.id}</div>
        <div data-testid="title">{step.title}</div>
      </div>
    ));
    const alertActionLinks = alertItem?.actionCallbacks?.map(action => (
      <button onClick={() => action.callback()} key={action.title}>
        {action.title}
      </button>
    ));
    return (
      <div data-testid="factory-loader-page">
        <div data-testid="current-step-id">{currentStepId}</div>
        <div data-testid="alert">
          <span data-testid="alert-title">{alertItem?.title}</span>
          <span data-testid="alert-body">{alertItem?.children}</span>
          <div>{alertActionLinks}</div>
        </div>
        <div>{wizardSteps}</div>
      </div>
    );
  }
}
