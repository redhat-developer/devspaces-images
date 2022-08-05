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
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertVariant } from '@patternfly/react-core';
import { WorkspaceLoaderPage } from '..';
import { LoadingStep, List, LoaderStep } from '../../../../components/Loader/Step';
import {
  getWorkspaceLoadingSteps,
  buildLoaderSteps,
} from '../../../../components/Loader/Step/buildSteps';
import { AlertItem, LoaderTab } from '../../../../services/helpers/types';
import getComponentRenderer from '../../../../services/__mocks__/getComponentRenderer';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});
jest.mock('../../../../components/Loader/Alert');
jest.mock('../../../../components/Loader/Progress');
jest.mock('../../../../components/WorkspaceLogs');
jest.mock('../../Common');

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnWorkspaceRestart = jest.fn();

const currentStepId = LoadingStep.INITIALIZE;

describe('Workspace loader page', () => {
  let steps: List<LoaderStep>;

  beforeEach(() => {
    const loadingSteps = getWorkspaceLoadingSteps();
    steps = buildLoaderSteps(loadingSteps);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle reload', () => {
    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Failed to start the workspace',
      variant: AlertVariant.danger,
    };
    renderComponent({ steps: steps.values, alertItem });

    const reloadButton = screen.getByRole('button', { name: 'Restart' });
    userEvent.click(reloadButton);

    expect(mockOnWorkspaceRestart).toHaveBeenCalled();

    const activeTab = screen.queryByTestId('active-tab-key');
    expect(activeTab?.textContent).toEqual(LoaderTab.Progress.toString());
  });

  it('should handle reload in verbose mode', () => {
    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Failed to start the workspace',
      variant: AlertVariant.danger,
    };
    renderComponent({ steps: steps.values, alertItem });

    const reloadButton = screen.getByRole('button', { name: 'Open in Verbose mode' });
    userEvent.click(reloadButton);

    expect(mockOnWorkspaceRestart).toHaveBeenCalled();

    const activeTab = screen.queryByTestId('active-tab-key');
    expect(activeTab?.textContent).toEqual(LoaderTab.Logs.toString());
  });

  it('should handle tab change', () => {
    renderComponent({ steps: steps.values, initialTab: 'Progress' });

    const activeTab = screen.queryByTestId('active-tab-key');
    expect(activeTab?.textContent).toEqual(LoaderTab.Progress.toString());

    const logsTabButton = screen.getByRole('button', { name: 'Logs' });
    userEvent.click(logsTabButton);

    expect(activeTab?.textContent).toEqual(LoaderTab.Logs.toString());
  });
});

function getComponent(props: {
  steps: LoaderStep[];
  initialTab?: keyof typeof LoaderTab;
  alertItem?: AlertItem;
}): React.ReactElement {
  return (
    <WorkspaceLoaderPage
      alertItem={props.alertItem}
      currentStepId={currentStepId}
      onRestart={mockOnWorkspaceRestart}
      steps={props.steps}
      tabParam={'Progress'}
      workspace={undefined}
    />
  );
}
