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
import { convertWorkspace, Workspace, WorkspaceAdapter } from '../../services/workspace-adapter';
import { DevWorkspaceBuilder } from '../../store/__mocks__/devWorkspaceBuilder';
import devfileApi from '../../services/devfileApi';
import { safeDump } from 'js-yaml';
import { CheWorkspaceBuilder } from '../../store/__mocks__/cheWorkspaceBuilder';

const showAlertMock = jest.fn();
const setWorkspaceQualifiedName = jest.fn();
const createWorkspaceFromDevfileMock = jest.fn().mockResolvedValue(undefined);
const requestWorkspaceMock = jest.fn().mockResolvedValue(undefined);
const startWorkspaceMock = jest.fn().mockResolvedValue(undefined);
const requestFactoryResolverMock = jest.fn().mockResolvedValue(undefined);
const setWorkspaceIdMock = jest.fn().mockResolvedValue(undefined);
const clearWorkspaceIdMock = jest.fn().mockResolvedValue(undefined);

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
          return convertWorkspace({
            id: 'id-wksp-test',
            attributes,
            namespace,
            devfile,
            temporary: false,
            status: 'STOPPED'
          });
        },
      setWorkspaceId: (id: string) => async (): Promise<void> => {
        setWorkspaceIdMock(id);
      },
      clearWorkspaceId: () => async (): Promise<void> => {
        clearWorkspaceIdMock();
      },
      setWorkspaceQualifiedName: ( namespace: string, workspaceName: string) => async (): Promise<void> => {
        setWorkspaceQualifiedName(namespace, workspaceName);
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
    resolvedDevfileMessage?: string;
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
      <div data-testid="factory-loader-devfile-location-info">{props.resolvedDevfileMessage}</div>
    </div>);
  };
});

const namespace = 'che';

describe('Factory Loader container', () => {

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('converting devfiles', () => {
    it('should NOT convert devfile v1 in Che Server mode', async () => {
      const location = 'http://test-location';
      const workspaceV1 = new CheWorkspaceBuilder()
        .withId('my-workspace-id')
        .withName('my-project')
        .build();
      const workspace = convertWorkspace(workspaceV1);

      const store = new FakeStoreBuilder()
        .withCheWorkspaces({
          workspaces: [workspaceV1],
        })
        .withWorkspaces({
          workspaceId: workspace.id,
          namespace: workspace.namespace,
          workspaceName: workspace.name,
        })
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'false',
        } as che.WorkspaceSettings)
        .withFactoryResolver({
          v: '4.0',
          source: 'devfile.yaml',
          devfile: workspace.devfile,
          location,
          links: [],
        })
        .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
        .build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: location });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() => expect(startWorkspaceMock).toHaveBeenCalled());

      const convertingMessage = screen.queryByText(
        'Devfile 2.x version found, converting it to devfile version 1.',
        { exact: false },
      );
      // the message should not appear
      expect(convertingMessage).toBeNull();

      // the correct devfile should be passed
      expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(
        workspace.devfile,
        undefined,
        expect.anything(),
        expect.anything(),
      );
    });

    it('should convert devfile v2 to v1 in Che Server mode', async () => {
      const location = 'http://test-location';
      const workspaceV2 = new DevWorkspaceBuilder()
        .withId('my-workspace-id')
        .withName('my-project')
        .build();
      const workspace = convertWorkspace(workspaceV2);
      const workspaceV1 = new CheWorkspaceBuilder()
        .withId(workspace.id)
        .withName(workspace.name)
        .build();

      const store = new FakeStoreBuilder()
        .withCheWorkspaces({
          workspaces: [workspaceV1],
        })
        .withWorkspaces({
          workspaceId: workspace.id,
          namespace: workspace.namespace,
          workspaceName: workspace.name,
        })
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'false',
        } as che.WorkspaceSettings)
        .withFactoryResolver({
          v: '4.0',
          source: 'devfile.yaml',
          devfile: workspace.devfile,
          location,
          links: [],
        })
        .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
        .build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: location });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() => expect(startWorkspaceMock).toHaveBeenCalled());

      const convertingMessage = screen.queryByText(
        'Devfile 2.x version found, converting it to devfile version 1.',
        { exact: false },
      );
      // the message should appear
      expect(convertingMessage).not.toBeNull();

      // the correct devfile should be passed
      expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          apiVersion: workspaceV1.devfile.apiVersion,
          metadata: expect.objectContaining({
            name: expect.stringMatching(workspaceV1.devfile.metadata.name as string),
          }),
        } as che.WorkspaceDevfile),
        undefined,
        expect.anything(),
        expect.anything(),
      );
    });

    it('should NOT convert devfile v2 in devworkspaces mode', async () => {
      const location = 'http://test-location';
      const workspaceV2 = new DevWorkspaceBuilder()
        .withId('my-workspace-id')
        .withName('my-project')
        .build();
      const workspace = convertWorkspace(workspaceV2);

      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [workspaceV2],
        })
        .withWorkspaces({
          workspaceId: workspace.id,
          namespace: workspace.namespace,
          workspaceName: workspace.name,
        })
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'true',
        } as che.WorkspaceSettings)
        .withFactoryResolver({
          v: '4.0',
          source: 'devfile.yaml',
          devfile: workspace.devfile,
          location,
          links: [],
        })
        .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
        .build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: location });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() => expect(startWorkspaceMock).toHaveBeenCalled());

      const convertingMessage = screen.queryByText(
        'Devfile 2.x version found, converting it to devfile version 1.',
        { exact: false },
      );
      // the message should not appear
      expect(convertingMessage).toBeNull();

      // the correct devfile should be passed
      const devfile = workspace.devfile as devfileApi.Devfile;
      expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          schemaVersion: devfile.schemaVersion,
          metadata: expect.objectContaining({
            name: expect.stringMatching(devfile.metadata.name),
          }),
        } as devfileApi.Devfile),
        undefined,
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('Use a devfile V1', () => {

    it('should resolve the factory, create and start a new workspace', async () => {
      const location = 'http://test-location';
      const workspace = createFakeCheWorkspace('wrksp-test-id', 'wrksp-test-name');
      const workspaceAdapter = convertWorkspace(workspace);

      renderComponentV1(location, workspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');

      await waitFor(() => expect(clearWorkspaceIdMock).toHaveBeenCalled());
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

      jest.runOnlyPendingTimers();
      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

      jest.runOnlyPendingTimers();
      await waitFor(() =>
        expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(workspace.devfile, undefined, namespace, { stackName: location + '/' }));
      expect(setWorkspaceQualifiedName).toHaveBeenCalledWith(namespace, workspace.devfile.metadata.name);

      jest.runOnlyPendingTimers();
      expect(showAlertMock).not.toHaveBeenCalled();
      await waitFor(() => expect(requestWorkspaceMock).toHaveBeenCalledWith(workspaceAdapter));
      await waitFor(() => expect(startWorkspaceMock).toHaveBeenCalledWith(workspaceAdapter));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.START_WORKSPACE]);
    });

    it('should resolve the factory, create a new workspace and open IDE', async () => {
      const location = 'http://test-location';
      const workspace = createFakeWorkspaceWithRuntimeV1('id-wksp-test');
      const workspaceAdapter = convertWorkspace(workspace);

      renderComponentV1(location, workspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');

      await waitFor(() => expect(clearWorkspaceIdMock).toHaveBeenCalled());
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

      jest.runOnlyPendingTimers();
      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

      jest.runOnlyPendingTimers();
      await waitFor(() =>
        expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(workspace.devfile, undefined, namespace, { stackName: location + '/' }));
      expect(setWorkspaceQualifiedName).toHaveBeenCalledWith(namespace, workspace.devfile.metadata.name);

      jest.runOnlyPendingTimers();
      expect(showAlertMock).toBeCalledWith({
        alertVariant: AlertVariant.warning,
        title: 'You\'re starting an ephemeral workspace. All changes to the source code will be lost ' +
          'when the workspace is stopped unless they are pushed to a remote code repository.'
      });
      expect(setWorkspaceIdMock).toHaveBeenCalledWith(workspace.id);
      await waitFor(() => expect(requestWorkspaceMock).toHaveBeenCalledWith(workspaceAdapter));
      await waitFor(() => expect(startWorkspaceMock).not.toHaveBeenCalled());

      jest.runOnlyPendingTimers();
      await waitFor(() => expect(requestWorkspaceMock).toHaveBeenCalledWith(workspaceAdapter));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.OPEN_IDE]);
    });

    it('should resolve the factory, create a new workspace with param overriding', async () => {
      const location = 'http://test-location&override.metadata.generateName=testPrefix';
      const workspace = createFakeWorkspaceWithRuntimeV1('id-wksp-test', location);
      renderComponentV1(location, workspace);

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
          }, undefined, namespace,
          { stackName: 'http://test-location/?override.metadata.generateName=testPrefix' }));
    });

    it('should show a target error with "error_code=invalid_request"', () => {
      const location = 'http://test-location&error_code=invalid_request';
      const workspace = createFakeWorkspaceWithRuntimeV1('id-wksp-test');

      renderComponentV1(location, workspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.INITIALIZING]);

      expect(showAlertMock).toHaveBeenCalledWith(expect.objectContaining({
        alertVariant: 'danger',
        title: 'Could not resolve devfile from private repository because authentication request is missing a parameter,' +
          ' contains an invalid parameter, includes a parameter more than once, or is otherwise invalid.',
      }));
    });

    it('should show a target error with "error_code=access_denied"', () => {
      const location = 'http://test-location&error_code=access_denied';
      const workspace = createFakeWorkspaceWithRuntimeV1('id-wksp-test');

      renderComponentV1(location, workspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.INITIALIZING]);

      expect(showAlertMock).toHaveBeenCalledWith(expect.objectContaining({
        alertVariant: 'danger',
        title: 'Could not resolve devfile from private repository because the user or authorization server denied the authentication request.',
      }));
    });

    it('should resolve the factory with "policies.create=peruser"', async () => {
      const location = 'http://test-location&policies.create=peruser';
      const workspace = createFakeWorkspaceWithRuntimeV1('id-wksp-test', 'http://test-location/?policies.create=peruser');
      const workspaceAdapter = convertWorkspace(workspace);

      renderComponentV1(location, workspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

      jest.runOnlyPendingTimers();
      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0]));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

      jest.runOnlyPendingTimers();
      expect(createWorkspaceFromDevfileMock).not.toHaveBeenCalled();

      jest.runOnlyPendingTimers();
      await waitFor(() => expect(requestWorkspaceMock).toHaveBeenCalledWith(workspaceAdapter));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.OPEN_IDE]);
    });

    it('should resolve the factory with  the preferred storage type "persistent"', async () => {
      const location = 'http://test-location';
      const preferredStorageType = 'persistent';
      const workspace = createFakeWorkspaceWithRuntimeV1('test-wksp-id', 'test-stack-name', 'test-wksp-name', {});

      renderComponentV1(location, workspace, preferredStorageType);

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
          }, undefined, namespace, { stackName: location + '/' }));
    });

    it('should resolve the factory with  the preferred storage type "ephemeral"', async () => {
      const location = 'http://test-location';
      const preferredStorageType = 'ephemeral';
      const workspace = createFakeWorkspaceWithRuntimeV1('test-wksp-id', 'test-stack-name', 'test-wksp-name', {});

      renderComponentV1(location, workspace, preferredStorageType);

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
          }), undefined, namespace, { stackName: location + '/' }));
    });

    it('should resolve the factory with  the preferred storage type "async"', async () => {
      const location = 'http://test-location';
      const preferredStorageType = 'async';
      const workspace = createFakeWorkspaceWithRuntimeV1('test-wksp-id', 'test-stack-name', 'test-wksp-name', {});

      renderComponentV1(location, workspace, preferredStorageType);

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
          }), undefined, namespace, { stackName: location + '/' }));
    });

    it('should show an error if something wrong with Repository/Devfile URL', async () => {
      const message = 'Repository/Devfile URL is missing. Please specify it via url query param: ' +
        window.location.origin + window.location.pathname + '#/load-factory?url= .';
      const workspace = createFakeWorkspaceWithRuntimeV1('id-wksp-test');
      renderComponentV1('', workspace);

      expect(requestFactoryResolverMock).not.toBeCalled();
      await waitFor(() => expect(showAlertMock).toBeCalledWith({ alertVariant: AlertVariant.danger, title: message }));
      const elementHasError = screen.getByTestId('factory-loader-has-error');
      expect(elementHasError.innerHTML).toEqual('true');

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.CREATE_WORKSPACE]);
    });
  });

  describe('Use a devfile V2', () => {

    it('should resolve the factory with create policie "peruser" and open existing workspace', async () => {
      const location = 'http://test-location&policies.create=peruser';
      const name = 'test-name';
      const devWorkspace = new DevWorkspaceBuilder()
        .withId('id-wksp-test')
        .withName(name)
        .withNamespace('test')
        .build();
      renderComponentV2(location, devWorkspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

      jest.runOnlyPendingTimers();
      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0]));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

      jest.runOnlyPendingTimers();

      await waitFor(() => expect(createWorkspaceFromDevfileMock).not.toBeCalled());
    });

    it('should resolve the factory with create policy "peruser" and create a new workspace', async () => {
      const location = 'http://test2-location&policies.create=peruser';
      const name = 'test-name';
      const devWorkspace = new DevWorkspaceBuilder()
        .withId('id-wksp-test')
        .withName(name)
        .withNamespace('test')
        .build();
      renderComponentV2(location, devWorkspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

      jest.runOnlyPendingTimers();
      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0]));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

      jest.runOnlyPendingTimers();

      await waitFor(() =>
        expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(
          {
            schemaVersion: '2.1.0',
            metadata: {
              name: name,
              namespace: 'test',
              attributes: {
                'dw.metadata.annotations': {
                  'che.eclipse.org/devfile-source': safeDump({ factory: { params: 'url=http://test2-location&policies.create=peruser' } })
                }
              }
            },
            components: [],
          }, undefined, undefined, {
          factoryParams: 'url=http://test2-location&policies.create=peruser',
          'policies.create': 'peruser'
        }));
    });
  });

  it('should resolve the factory with create policy "perclick" and create a new workspace', async () => {
    const location = 'http://test-location&policies.create=perclick';
    const devWorkspace = new DevWorkspaceBuilder()
      .withId('id-wksp-test')
      .withName('test-name')
      .withNamespace('test')
      .build();
    renderComponentV2(location, devWorkspace);

    const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE]);

    jest.runOnlyPendingTimers();
    await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0]));
    expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE]);

    jest.runOnlyPendingTimers();

    await waitFor(() => expect(createWorkspaceFromDevfileMock).toHaveBeenCalledTimes(1));
  });

});

function renderComponentV2(
  url: string,
  workspace: devfileApi.DevWorkspace,
): RenderResult {
  const wrks = convertWorkspace(workspace);
  (wrks.ref as devfileApi.DevWorkspace).metadata.annotations = {
    'che.eclipse.org/devfile-source': safeDump({ factory: { params: 'url=http://test-location&policies.create=peruser' } })
  };
  const store = new FakeStoreBuilder()
    .withDevWorkspaces({
      workspaces: [workspace],
    })
    .withWorkspaces({
      workspaceId: WorkspaceAdapter.getId(workspace),
      namespace: namespace,
      workspaceName: workspace.metadata.name,
    })
    .withWorkspacesSettings({
      'che.devworkspaces.enabled': 'true',
    })
    .withFactoryResolver({
      v: '4.0',
      source: 'devfile.yaml',
      devfile: convertWorkspace(workspace).devfile,
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

function renderComponentV1(
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
      workspaceId: workspace.id,
      namespace: namespace,
      workspaceName: workspace.devfile.metadata.name
    })
    .withWorkspacesSettings(settings as che.WorkspaceSettings)
    .withFactoryResolver({
      v: '4.0',
      source: 'devfile.yaml',
      devfile: workspace.devfile as che.WorkspaceDevfile,
      location: url.split('&')[0],
      links: []
    })
    .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
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

function createFakeWorkspaceWithRuntimeV1(
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
