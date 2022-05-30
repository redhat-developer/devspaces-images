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
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';
import { render, screen, waitFor, within } from '@testing-library/react';
import { StateMock } from '@react-mock/state';
import { ROUTE } from '../../../route.enum';
import { getMockRouterProps } from '../../../services/__mocks__/router';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import IdeLoaderContainer, { State } from '..';
import { Workspace } from '../../../services/workspace-adapter';
import { ActionCreators } from '../../../store/Workspaces';
import { AppThunk } from '../../../store';
import { IdeLoaderSteps } from '../../../components/Loader/Step';
import userEvent from '@testing-library/user-event';
import { ToggleBarsContext } from '../../../contexts/ToggleBars';

jest.mock('../../../pages/IdeLoader');

const mockStartWorkspace = jest.fn();
const mockUpdateWorkspace = jest.fn();
jest.mock('../../../store/Workspaces/index', () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return {
    actionCreators: {
      startWorkspace:
        (_workspace: Workspace): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> => {
          return mockStartWorkspace();
        },
      updateWorkspace:
        (_workspace: Workspace): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> => {
          return mockUpdateWorkspace();
        },
      deleteWorkspaceLogs:
        (_workspace: Workspace): AppThunk<Action> =>
        (): void => {
          // no-op
        },
    } as ActionCreators,
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
});

describe('IDE Loader container, step START_WORKSPACE', () => {
  const namespace = 'che-user';
  const workspaceName = 'test-workspace';
  const firsStepId = IdeLoaderSteps.INITIALIZING.toString();
  const stepId = IdeLoaderSteps.START_WORKSPACE.toString();
  const lastStepId = IdeLoaderSteps.OPEN_IDE.toString();
  let localState: State;

  beforeEach(() => {
    localState = {
      shouldStart: false,
      currentStepIndex: 1,
      matchParams: {
        namespace,
        workspaceName,
      },
    };

    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('workspace is FAILING', async () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'FAILING' })
            .build(),
        ],
      })
      .build();

    const { reRenderComponent } = renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // should report the error
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace status changed unexpectedly to "Failing".',
    );

    const reloadButton = screen.getByTestId('reload-button');
    userEvent.click(reloadButton);

    // should reset progress to the very first step
    await waitFor(() => expect(currentStepId.textContent).toEqual(firsStepId));

    expect(hasError.textContent).toEqual('false');
    expect(alertTitle.textContent).toEqual('');

    const nextStore = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'RUNNING' })
            .build(),
        ],
      })
      .build();
    reRenderComponent(namespace, workspaceName, nextStore, localState);

    jest.runAllTimers();

    // should eventually switch to the very last step
    await waitFor(() => expect(currentStepId.textContent).toEqual(lastStepId));
  });
});

type RenderParams = Parameters<typeof getComponent>;
function getComponent(
  namespace: string,
  workspaceName: string,
  store: Store,
  localState: State,
): React.ReactElement {
  const props = getMockRouterProps(ROUTE.IDE_LOADER, { namespace, workspaceName });
  return (
    <Provider store={store}>
      <ToggleBarsContext.Provider
        value={{
          hideAll: jest.fn(),
          showAll: jest.fn(),
        }}
      >
        <StateMock state={localState}>
          <IdeLoaderContainer {...props} />
        </StateMock>
      </ToggleBarsContext.Provider>
    </Provider>
  );
}

function renderComponent(...args: RenderParams): {
  reRenderComponent: (...args: RenderParams) => void;
} {
  const res = render(getComponent(...args));

  return {
    reRenderComponent: (...args) => {
      res.rerender(getComponent(...args));
    },
  };
}
