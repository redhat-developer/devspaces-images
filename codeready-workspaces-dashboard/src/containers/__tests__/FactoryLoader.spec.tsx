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
import { AlertVariant } from '@patternfly/react-core';
import { RenderResult, render, screen, waitFor } from '@testing-library/react';
import { ROUTE } from '../../route.enum';
import { getMockRouterProps } from '../../services/__mocks__/router';
import { FakeStoreBuilder } from '../../store/__mocks__/storeBuilder';
import { createFakeCheWorkspace } from '../../store/__mocks__/workspace';
import { WorkspaceStatus } from '../../services/helpers/types';
import FactoryLoaderContainer, { LoadFactorySteps } from '../FactoryLoader';
import { AlertOptions } from '../../pages/IdeLoader';
import { convertWorkspace, Workspace } from '../../services/workspaceAdapter';

const showAlertMock = jest.fn();
const createWorkspaceFromDevfileMock = jest.fn().mockResolvedValue(undefined);
const requestWorkspaceMock = jest.fn().mockResolvedValue(undefined);
const startWorkspaceMock = jest.fn().mockResolvedValue(undefined);
const requestFactoryResolverMock = jest.fn().mockResolvedValue(undefined);
const setWorkspaceIdMock = jest.fn().mockResolvedValue(undefined);
const clearWorkspaceIdMock = jest.fn().mockResolvedValue(undefined);

let workspaceFromDevfile: Workspace;
jest.mock('../../store/Workspaces/index', () => {
  return {
    actionCreators: {
      requestWorkspace: (id) => async (): Promise<void> => {
        requestWorkspaceMock(id);
      },
      startWorkspace: workspace => async (): Promise<void> => {
        startWorkspaceMock(workspace);
      },
      createWorkspaceFromDevfile: (devfile, namespace, infrastructureNamespace, attributes) =>
        async (): Promise<Workspace> => {
          createWorkspaceFromDevfileMock(devfile, namespace, infrastructureNamespace, attributes);
          jest.runOnlyPendingTimers();
          return convertWorkspace({ id: 'id-wksp-test', attributes, namespace, devfile, temporary: false, status: 'STOPPED' });
        },
      setWorkspaceId: (id: string) => async (): Promise<void> => {
        setWorkspaceIdMock(id);
      },
      clearWorkspaceId: () => async (): Promise<void> => {
        clearWorkspaceIdMock();
      },
    },
  };
});

jest.mock('../../store/FactoryResolver', () => {
  return {
    actionCreators: {
      requestFactoryResolver: (location: string, overrideParams?: {
        [params: string]: string
      }) => async (): Promise<void> => {
        if (!overrideParams) {
          requestFactoryResolverMock(location);
        } else {
          requestFactoryResolverMock(location, overrideParams);
        }
      }
    }
  };
});

jest.mock('../../pages/FactoryLoader', () => {
  return function DummyWizard(props: {
    hasError: boolean,
    currentStep: LoadFactorySteps,
    workspaceName: string;
    workspaceId: string;
    devfileLocationInfo?: string;
    callbacks?: {
      showAlert?: (alertOptions: AlertOptions) => void
    }
  }): React.ReactElement {
    if (props.callbacks) {
      props.callbacks.showAlert = showAlertMock;
    }
    return (<div>Dummy Wizard
      <div data-testid="factory-loader-has-error">{props.hasError.toString()}</div>
      <div data-testid="factory-loader-current-step">{props.currentStep}</div>
      <div data-testid="factory-loader-workspace-name">{props.workspaceName}</div>
      <div data-testid="factory-loader-workspace-id">{props.workspaceId}</div>
      <div data-testid="factory-loader-devfile-location-info">{props.devfileLocationInfo}</div>
    </div>);
  };
});

describe('Factory Loader container', () => {

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should resolve the factory, create and start a new workspace', async () => {
    const location = 'http://test-location';
    const workspace = createFakeCheWorkspace('wrksp-test-id', 'wrksp-test-name');
    workspaceFromDevfile = convertWorkspace(workspace);

    renderComponent(location, workspace);

    const elementCurrentStep = screen.getByTestId('factory-loader-current-step');

    await waitFor(() => expect(clearWorkspaceIdMock).toHaveBeenCalled());
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location));
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() =>
      expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(workspace.devfile, undefined, undefined, { stackName: location + '/' }));

    jest.runOnlyPendingTimers();
    expect(showAlertMock).not.toHaveBeenCalled();
    await waitFor(() => expect(requestWorkspaceMock).toHaveBeenCalledWith(workspaceFromDevfile));
    await waitFor(() => expect(startWorkspaceMock).toHaveBeenCalledWith(workspaceFromDevfile));
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.START_WORKSPACE]);
  });

  it('should resolve the factory, create a new workspace and open IDE', async () => {
    const location = 'http://test-location';
    const workspace = createFakeWorkspaceWithRuntime('id-wksp-test');
    workspaceFromDevfile = convertWorkspace(workspace);

    renderComponent(location, workspace);

    const elementCurrentStep = screen.getByTestId('factory-loader-current-step');

    await waitFor(() => expect(clearWorkspaceIdMock).toHaveBeenCalled());
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location));
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() =>
      expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(workspace.devfile, undefined, undefined, { stackName: location + '/' }));

    jest.runOnlyPendingTimers();
    expect(showAlertMock).toBeCalledWith({
      alertVariant: AlertVariant.warning,
      title: 'You\'re starting an ephemeral workspace. All changes to the source code will be lost ' +
        'when the workspace is stopped unless they are pushed to a remote code repository.'
    });
    expect(setWorkspaceIdMock).toHaveBeenCalledWith(workspace.id);
    await waitFor(() => expect(requestWorkspaceMock).toHaveBeenCalledWith(workspaceFromDevfile));
    await waitFor(() => expect(startWorkspaceMock).not.toHaveBeenCalled());

    jest.runOnlyPendingTimers();
    await waitFor(() => expect(requestWorkspaceMock).toHaveBeenCalledWith(workspaceFromDevfile));
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.OPEN_IDE]);
  });

  it('should resolve the factory, create a new workspace with param overriding', async () => {
    const location = 'http://test-location&override.metadata.generateName=testPrefix';
    const workspace = createFakeWorkspaceWithRuntime('id-wksp-test', location);
    renderComponent(location, workspace);

    const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(
      location.split('&')[0], {
      'override.metadata.generateName': 'testPrefix'
    }));
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() =>
      expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(
        {
          apiVersion: '1.0.0',
          metadata: {
            name: 'name-wksp-2',
          },
          attributes: { persistVolumes: 'false' }
        }, undefined, undefined,
        { stackName: 'http://test-location/?override.metadata.generateName=testPrefix' }));
  });

  it('should show a target error with \'error_code=invalid_request\'', () => {
    const location = 'http://test-location&error_code=invalid_request';
    const workspace = createFakeWorkspaceWithRuntime('id-wksp-test');
    workspaceFromDevfile = convertWorkspace(workspace);

    renderComponent(location, workspace);

    const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.INITIALIZING]);

    expect(showAlertMock).toHaveBeenCalledWith(expect.objectContaining({
      alertVariant: 'danger',
      title: 'Could not resolve devfile from private repository because authentication request is missing a parameter,' +
        ' contains an invalid parameter, includes a parameter more than once, or is otherwise invalid.',
    }));
  });

  it('should show a target error with \'error_code=access_denied\'', () => {
    const location = 'http://test-location&error_code=access_denied';
    const workspace = createFakeWorkspaceWithRuntime('id-wksp-test');
    workspaceFromDevfile = convertWorkspace(workspace);

    renderComponent(location, workspace);

    const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.INITIALIZING]);

    expect(showAlertMock).toHaveBeenCalledWith(expect.objectContaining({
      alertVariant: 'danger',
      title: 'Could not resolve devfile from private repository because the user or authorization server denied the authentication request.',
    }));
  });

  it('should resolve the factory with \'policies.create=peruser\'', async () => {
    const location = 'http://test-location&policies.create=peruser';
    const workspace = createFakeWorkspaceWithRuntime('id-wksp-test', 'http://test-location/?policies.create=peruser');
    workspaceFromDevfile = convertWorkspace(workspace);

    renderComponent(location, workspace);

    const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0]));
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

    jest.runOnlyPendingTimers();
    expect(createWorkspaceFromDevfileMock).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();
    await waitFor(() => expect(requestWorkspaceMock).toHaveBeenCalledWith(workspaceFromDevfile));
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.OPEN_IDE]);
  });

  it('should resolve the factory with  the preferred storage type \'persistent\'', async () => {
    const location = 'http://test-location';
    const preferredStorageType = 'persistent';
    const workspace = createFakeWorkspaceWithRuntime('test-wksp-id', 'test-stack-name', 'test-wksp-name', {});

    renderComponent(location, workspace, preferredStorageType);

    const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0]));
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() =>
      expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(
        {
          apiVersion: '1.0.0',
          metadata: {
            name: 'test-wksp-name',
          },
        }, undefined, undefined, { stackName: location + '/' }));
  });

  it('should resolve the factory with  the preferred storage type \'ephemeral\'', async () => {
    const location = 'http://test-location';
    const preferredStorageType = 'ephemeral';
    const workspace = createFakeWorkspaceWithRuntime('test-wksp-id', 'test-stack-name', 'test-wksp-name', {});

    renderComponent(location, workspace, preferredStorageType);

    const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0]));
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() =>
      expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: {
            persistVolumes: 'false',
          },
        }), undefined, undefined, { stackName: location + '/' }));
  });

  it('should resolve the factory with  the preferred storage type \'async\'', async () => {
    const location = 'http://test-location';
    const preferredStorageType = 'async';
    const workspace = createFakeWorkspaceWithRuntime('test-wksp-id', 'test-stack-name', 'test-wksp-name', {});

    renderComponent(location, workspace, preferredStorageType);

    const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0]));
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() =>
      expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: {
            persistVolumes: 'false',
            asyncPersist: 'true',
          },
        }), undefined, undefined, { stackName: location + '/' }));
  });

  it('should show an error if something wrong with Repository/Devfile URL', async () => {
    const message = 'Repository/Devfile URL is missing. Please specify it via url query param: ' +
      window.location.origin + window.location.pathname + '#/load-factory?url= .';
    const workspace = createFakeWorkspaceWithRuntime('id-wksp-test');
    renderComponent('', workspace);

    expect(requestFactoryResolverMock).not.toBeCalled();
    await waitFor(() => expect(showAlertMock).toBeCalledWith({ alertVariant: AlertVariant.danger, title: message }));
    const elementHasError = screen.getByTestId('factory-loader-has-error');
    expect(elementHasError.innerHTML).toEqual('true');

    const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.CREATE_WORKSPACE]);
  });
});

function renderComponent(
  url: string,
  workspace: che.Workspace,
  preferredStorageType?: che.WorkspaceStorageType
): RenderResult {
  const settings = preferredStorageType ? { 'che.workspace.storage.preferred_type': preferredStorageType } : {};
  const store = new FakeStoreBuilder()
    .withCheWorkspaces({
      workspaces: [workspace],
    })
    .withWorkspaces({
      workspaceId: workspace.id
    })
    .withWorkspacesSettings(settings as che.WorkspaceSettings)
    .withFactoryResolver({
      v: '4.0',
      source: 'devfile.yaml',
      devfile: workspace.devfile as api.che.workspace.devfile.Devfile,
      location: url.split('&')[0],
      scm_info: {
        clone_url: 'http://github.com/clone-url',
        scm_provider: 'github'
      },
      links: []
    })
    .build();
  const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url });

  return render(
    <Provider store={store}>
      <FactoryLoaderContainer
        {...props}
      />
    </Provider>,
  );
}

function createFakeWorkspaceWithRuntime(
  workspaceId: string,
  stackName = '',
  workspaceName = 'name-wksp-2',
  attributes: che.WorkspaceDevfileAttributes = { persistVolumes: 'false' }
): che.Workspace {
  const workspace = createFakeCheWorkspace(
    workspaceId,
    workspaceName,
    'namespace',
    WorkspaceStatus.RUNNING,
    {
      machines: {
        'theia-factory-test': {
          attributes: {
            source: 'tool',
          },
          servers: {
            theia: {
              status: WorkspaceStatus.RUNNING,
              attributes: {
                type: 'ide',
              },
              url: 'https://dummy-editora-server',
            },
          },
          status: WorkspaceStatus.RUNNING,
        },
      },
      status: WorkspaceStatus.RUNNING,
      activeEnv: 'default',
    }
  );
  workspace.devfile.attributes = attributes;
  if (!workspace.attributes) {
    workspace.attributes = {
      infrastructureNamespace: '',
      created: ''
    };
  }
  workspace.attributes.stackName = stackName;

  return workspace;
}
