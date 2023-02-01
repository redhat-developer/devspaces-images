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
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkspaceLoaderPage from '..';
import { LoadingStep, List, LoaderStep } from '../../../../components/Loader/Step';
import {
  getWorkspaceLoadingSteps,
  buildLoaderSteps,
} from '../../../../components/Loader/Step/buildSteps';
import { AlertItem, LoaderTab } from '../../../../services/helpers/types';
import getComponentRenderer from '../../../../services/__mocks__/getComponentRenderer';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import { Workspace } from '../../../../services/workspace-adapter';
import { actionCreators } from '../../../../store/Workspaces';

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

const currentStepId = LoadingStep.INITIALIZE;

const mockStopWorkspace = jest.fn();
jest.mock('../../../../store/Workspaces');
(actionCreators.stopWorkspace as jest.Mock).mockImplementation(
  (...args) =>
    async () =>
      mockStopWorkspace(...args),
);

describe('Workspace loader page', () => {
  let steps: List<LoaderStep>;

  beforeEach(() => {
    const loadingSteps = getWorkspaceLoadingSteps();
    steps = buildLoaderSteps(loadingSteps);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

function getComponent(
  props: {
    steps: LoaderStep[];
    initialTab?: keyof typeof LoaderTab;
    alertItem?: AlertItem;
    workspace?: Workspace;
  },
  store?: Store,
): React.ReactElement {
  if (!store) {
    store = new FakeStoreBuilder().build();
  }

  return (
    <Provider store={store}>
      <WorkspaceLoaderPage
        alertItem={props.alertItem}
        currentStepId={currentStepId}
        steps={props.steps}
        tabParam={'Progress'}
        workspace={props.workspace}
      />
    </Provider>
  );
}
