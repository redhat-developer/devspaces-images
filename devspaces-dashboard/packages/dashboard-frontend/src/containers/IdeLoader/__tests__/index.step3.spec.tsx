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
import { Store } from 'redux';
import { render, screen, waitFor, within } from '@testing-library/react';
import { StateMock } from '@react-mock/state';
import { ROUTE } from '../../../route.enum';
import { getMockRouterProps } from '../../../services/__mocks__/router';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import IdeLoaderContainer, { State, TIMEOUT_TO_GET_URL_SEC } from '..';
import { IdeLoaderSteps } from '../../../components/Loader/Step';
import { ToggleBarsContext } from '../../../contexts/ToggleBars';

jest.mock('../../../pages/IdeLoader');

describe('IDE Loader container, step OPEN_IDE', () => {
  const namespace = 'che-user';
  const workspaceName = 'test-workspace';
  const stepId = IdeLoaderSteps.OPEN_IDE.toString();
  let localState: State;

  const mockLocationReplace = jest.fn();

  beforeEach(() => {
    localState = {
      shouldStart: true,
      currentStepIndex: 2,
      matchParams: {
        namespace,
        workspaceName,
      },
    };

    delete (window as any).location;
    (window.location as any) = { replace: mockLocationReplace };

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('workspace is RUNNING', async () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'RUNNING', mainUrl: 'main-url' })
            .build(),
        ],
      })
      .build();

    renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    jest.advanceTimersByTime(5000);

    // wait for opening IDE url
    await waitFor(() => expect(mockLocationReplace).toHaveBeenCalledWith('main-url'));
  });

  test(`workspace is RUNNING and mainUrl is not propagated longer than TIMEOUT_TO_GET_URL_SEC seconds`, async () => {
    const store = new FakeStoreBuilder()
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

    renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // initially no errors
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    // wait a bit more than necessary to end the timeout
    const time = (TIMEOUT_TO_GET_URL_SEC + 1) * 1000;
    jest.advanceTimersByTime(time);

    // there should be the error message
    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace has not received an IDE URL in the last 20 seconds. Try to re-open the workspace.',
    );
  });

  test(`workspace is RUNNING and mainUrl is propagated within TIMEOUT_TO_GET_URL_SEC seconds`, async () => {
    const store = new FakeStoreBuilder()
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

    const { reRenderComponent } = renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the timeout
    const time = (TIMEOUT_TO_GET_URL_SEC - 1) * 1000;
    jest.advanceTimersByTime(time);

    const currentStep = screen.getByTestId(stepId);

    // no errors at this moment
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    const nextStore = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'RUNNING', mainUrl: 'main-url' })
            .build(),
        ],
      })
      .build();
    reRenderComponent(namespace, workspaceName, nextStore, localState);

    // wait for opening IDE url
    await waitFor(() => expect(mockLocationReplace).toHaveBeenCalledWith('main-url'));
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

    renderComponent(namespace, workspaceName, store, localState);

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
