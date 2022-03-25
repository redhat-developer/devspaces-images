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
import { Action } from 'redux';
import { Provider } from 'react-redux';
import { AlertActionLink } from '@patternfly/react-core';
import { RenderResult, render, screen, waitFor } from '@testing-library/react';
import { ROUTE } from '../../route.enum';
import { getMockRouterProps } from '../../services/__mocks__/router';
import { FakeStoreBuilder } from '../../store/__mocks__/storeBuilder';
import { WorkspaceStatus } from '../../services/helpers/types';
import IdeLoaderContainer, { LoadIdeSteps } from '../IdeLoader';
import { Props } from '../../pages/IdeLoader';
import { AppThunk } from '../../store';
import { ActionCreators } from '../../store/Workspaces';
import { Workspace } from '../../services/workspace-adapter';
import { CheWorkspaceBuilder } from '../../store/__mocks__/cheWorkspaceBuilder';

const showAlertMock = jest.fn();
const hideAlertMock = jest.fn();
const requestWorkspaceMock = jest.fn().mockResolvedValue(undefined);
const startWorkspaceMock = jest.fn().mockResolvedValue(undefined);
const setWorkspaceIdMock = jest.fn();
const clearWorkspaceUIDMock = jest.fn();

jest.mock('../../store/Workspaces/index', () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return {
    actionCreators: {
      requestWorkspace:
        (workspace: Workspace): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> => {
          requestWorkspaceMock();
        },
      startWorkspace:
        (workspace: Workspace): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> => {
          startWorkspaceMock();
        },
      requestWorkspaces: (): AppThunk<Action, Promise<void>> => async (): Promise<void> => {
        return Promise.resolve();
      },
      setWorkspaceUID:
        (id: string): AppThunk<Action, void> =>
        (): void =>
          setWorkspaceIdMock(),
      clearWorkspaceUID: (): AppThunk<Action, void> => (): void => clearWorkspaceUIDMock(),
      updateWorkspace:
        (workspace: Workspace): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> => {
          return Promise.resolve();
        },
    } as ActionCreators,
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
});

jest.mock('../../pages/IdeLoader', () => {
  return function DummyWizard(props: Props): React.ReactElement {
    if (props.callbacks) {
      props.callbacks.showAlert = showAlertMock;
      props.callbacks.hideAlert = hideAlertMock;
    }
    return (
      <div>
        Dummy Wizard
        <div data-testid="ide-loader-has-error">{props.hasError.toString()}</div>
        <div data-testid="ide-loader-current-step">{props.currentStep}</div>
        <div data-testid="ide-loader-workspace-name">{props.workspaceName}</div>
        <div data-testid="ide-loader-workspace-uid">{props.workspaceUID}</div>
        <div data-testid="ide-loader-workspace-ide-url">{props.ideUrl}</div>
        <div data-testid="ide-loader-workspace-status">{props.status}</div>
      </div>
    );
  };
});

describe('IDE Loader container', () => {
  const runtime: che.WorkspaceRuntime = {
    machines: {
      'theia-ide-test': {
        attributes: {
          source: 'tool',
        },
        servers: {
          theia: {
            status: WorkspaceStatus.RUNNING,
            attributes: {
              type: 'ide',
            },
            url: 'https://server-test-4402.192.168.99.100.nip.io',
          },
        },
        status: WorkspaceStatus.RUNNING,
      },
    },
    status: WorkspaceStatus.RUNNING,
    activeEnv: 'default',
  };

  const workspace_1 = new CheWorkspaceBuilder()
    .withId('id-wksp-1')
    .withName('name-wksp-1')
    .withNamespace('admin1')
    .build();

  const workspace_2 = new CheWorkspaceBuilder()
    .withId('id-wksp-2')
    .withName('name-wksp-2')
    .withNamespace('admin2')
    .withRuntime(runtime)
    .withStatus(WorkspaceStatus.RUNNING)
    .build();

  const workspace_3 = new CheWorkspaceBuilder()
    .withId('id-wksp-3')
    .withName('name-wksp-3')
    .withNamespace('admin3')
    .withStatus(WorkspaceStatus.ERROR)
    .build();

  const store = new FakeStoreBuilder()
    .withWorkspaces({
      workspaceUID: 'id-wksp-1',
    })
    .withCheWorkspaces({
      workspaces: [workspace_1, workspace_2, workspace_3],
    })
    .build();

  const renderComponent = (namespace: string, workspaceName: string): RenderResult => {
    const props = getMockRouterProps(ROUTE.IDE_LOADER, { namespace, workspaceName });
    return render(
      <Provider store={store}>
        <IdeLoaderContainer {...props} />
      </Provider>,
    );
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should show an error if something wrong', async () => {
    const namespace = 'admin3';
    const workspaceName = 'name-wksp-46';

    renderComponent(namespace, workspaceName);

    expect(startWorkspaceMock).not.toBeCalled();
    expect(requestWorkspaceMock).not.toBeCalled();

    await waitFor(() =>
      expect(showAlertMock).toBeCalledWith(
        expect.objectContaining({
          alertVariant: 'danger',
          title: 'Failed to find the target workspace.',
        }),
      ),
    );

    const elementHasError = screen.getByTestId('ide-loader-has-error');
    expect(elementHasError.innerHTML).toEqual('true');

    const elementCurrentStep = Number.parseInt(
      screen.getByTestId('ide-loader-current-step').innerHTML,
      10,
    );
    expect(LoadIdeSteps[elementCurrentStep]).toEqual(LoadIdeSteps[LoadIdeSteps.INITIALIZING]);
  });

  it('error links are passed to alert when workspace start error is found', async () => {
    const namespace = 'admin3';
    const workspaceName = 'name-wksp-3';

    renderComponent(namespace, workspaceName);

    await waitFor(() => {
      expect(requestWorkspaceMock).toBeCalled();
    });
    // TODO: This does not work as expected as startWorkspaceMock is called asynchronously
    expect(startWorkspaceMock).not.toBeCalled();

    expect(showAlertMock).toBeCalled();

    const errorAlerts = (
      <React.Fragment>
        <AlertActionLink onClick={() => jest.fn()}>Restart</AlertActionLink>
        <AlertActionLink onClick={() => jest.fn()}>Open in Verbose mode</AlertActionLink>
      </React.Fragment>
    );
    const firstCalledArgs = showAlertMock.mock.calls[0][0];
    expect(firstCalledArgs.title).toEqual('Workspace name-wksp-3 failed to start');
    expect(firstCalledArgs.alertVariant).toEqual('danger');
    expect(JSON.stringify(firstCalledArgs.alertActionLinks)).toEqual(JSON.stringify(errorAlerts));

    const elementHasError = screen.getByTestId('ide-loader-has-error');
    expect(elementHasError.innerHTML).toEqual('true');

    expect(setWorkspaceIdMock).toBeCalled();

    const elementCurrentStep = Number.parseInt(
      screen.getByTestId('ide-loader-current-step').innerHTML,
      10,
    );
    expect(LoadIdeSteps[elementCurrentStep]).toEqual(LoadIdeSteps[LoadIdeSteps.START_WORKSPACE]);
  });

  it('should have correct WORKSPACE START and waiting for the workspace runtime', async () => {
    const namespace = 'admin1';
    const workspaceId = 'id-wksp-1';
    const workspaceName = 'name-wksp-1';

    renderComponent(namespace, workspaceName);

    expect(requestWorkspaceMock).toBeCalled();

    await waitFor(() => {
      expect(startWorkspaceMock).toHaveBeenCalledTimes(1);
    });

    const elementWorkspaceUID = screen.getByTestId('ide-loader-workspace-uid');
    expect(elementWorkspaceUID.innerHTML).toEqual(workspaceId);

    const elementWorkspaceName = screen.getByTestId('ide-loader-workspace-name');
    expect(elementWorkspaceName.innerHTML).toEqual(workspaceName);

    const elementCurrentStep = Number.parseInt(
      screen.getByTestId('ide-loader-current-step').innerHTML,
      10,
    );
    expect(LoadIdeSteps[elementCurrentStep]).toEqual(LoadIdeSteps[LoadIdeSteps.START_WORKSPACE]);

    const elementIdeUrl = screen.getByTestId('ide-loader-workspace-ide-url');
    expect(elementIdeUrl.innerHTML).toEqual('');
  });

  it('should have correct OPEN_IDE', () => {
    const ideUrl = 'https://server-test-4402.192.168.99.100.nip.io';
    const namespace = 'admin2';
    const workspaceName = 'name-wksp-2';

    renderComponent(namespace, workspaceName);

    expect(startWorkspaceMock).not.toBeCalled();
    expect(requestWorkspaceMock).not.toBeCalled();

    const elementHasError = screen.getByTestId('ide-loader-has-error');
    expect(elementHasError.innerHTML).toEqual('false');

    const elementWorkspaceName = screen.getByTestId('ide-loader-workspace-name');
    expect(elementWorkspaceName.innerHTML).toEqual(workspaceName);

    const elementCurrentStep = Number.parseInt(
      screen.getByTestId('ide-loader-current-step').innerHTML,
      10,
    );
    expect(LoadIdeSteps[elementCurrentStep]).toEqual(LoadIdeSteps[LoadIdeSteps.OPEN_IDE]);

    const elementWorkspaceUID = screen.getByTestId('ide-loader-workspace-uid');
    expect(elementWorkspaceUID.innerHTML).toEqual('');

    const elementIdeUrl = screen.getByTestId('ide-loader-workspace-ide-url');
    expect(elementIdeUrl.innerHTML).toEqual(ideUrl);
  });
});
