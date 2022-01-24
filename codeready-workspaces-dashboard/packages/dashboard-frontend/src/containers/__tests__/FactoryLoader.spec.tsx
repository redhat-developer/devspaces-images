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
import mockAxios from 'axios';
import { ROUTE } from '../../route.enum';
import { getMockRouterProps } from '../../services/__mocks__/router';
import { FakeStoreBuilder } from '../../store/__mocks__/storeBuilder';
import { createFakeCheWorkspace } from '../../store/__mocks__/workspace';
import { WorkspaceStatus } from '../../services/helpers/types';
import FactoryLoaderContainer, { LoadFactorySteps } from '../FactoryLoader';
import { AlertOptions } from '../../pages/IdeLoader';
import { convertWorkspace, Devfile, WorkspaceAdapter } from '../../services/workspace-adapter';
import { DevWorkspaceBuilder } from '../../store/__mocks__/devWorkspaceBuilder';
import devfileApi from '../../services/devfileApi';
import { safeDump } from 'js-yaml';
import { CheWorkspaceBuilder } from '../../store/__mocks__/cheWorkspaceBuilder';
import { ConvertedState, ResolverState } from '../../store/FactoryResolver';
import { actionCreators as workspacesActionCreators } from '../../store/Workspaces';
import {
  actionCreators as factoryResolverActionCreators,
  isOAuthResponse,
} from '../../store/FactoryResolver';

const showAlertMock = jest.fn();
const setWorkspaceQualifiedName = jest.fn();
const createWorkspaceFromDevfileMock = jest.fn().mockResolvedValue(undefined);
const requestWorkspaceMock = jest.fn().mockResolvedValue(undefined);
const startWorkspaceMock = jest.fn().mockResolvedValue(undefined);
const requestFactoryResolverMock = jest.fn().mockResolvedValue(undefined);
const setWorkspaceIdMock = jest.fn().mockResolvedValue(undefined);
const clearWorkspaceIdMock = jest.fn().mockResolvedValue(undefined);

const createWorkspaceFromResourcesMock = jest.fn().mockReturnValue(undefined);
jest.mock('../../store/Workspaces/devWorkspaces/index', () => {
  return {
    actionCreators: {
      createWorkspaceFromResources:
        (devworkspace: string, devworkspaceTemplate: string) => async (): Promise<void> => {
          createWorkspaceFromResourcesMock(devworkspace, devworkspaceTemplate);
        },
    },
  };
});

jest.mock('../../store/Workspaces');
(workspacesActionCreators.requestWorkspace as jest.Mock).mockImplementation(
  (id: string) => async () => requestWorkspaceMock(id),
);
(workspacesActionCreators.startWorkspace as jest.Mock).mockImplementation(
  (workspace: string) => async () => startWorkspaceMock(workspace),
);
(workspacesActionCreators.createWorkspaceFromDevfile as jest.Mock).mockImplementation(
  (
      devfile: Devfile,
      namespace: string,
      infrastructureNamespace: string,
      attributes: { [key: string]: string },
    ) =>
    async () => {
      createWorkspaceFromDevfileMock(devfile, namespace, infrastructureNamespace, attributes);
      return convertWorkspace({
        id: 'id-wksp-test',
        attributes: attributes as che.WorkspaceAttributes,
        namespace,
        devfile: devfile as che.WorkspaceDevfile,
        temporary: false,
        status: 'STOPPED',
      });
    },
);
(workspacesActionCreators.setWorkspaceId as jest.Mock).mockImplementation(
  (id: string) => async () => setWorkspaceIdMock(id),
);
(workspacesActionCreators.clearWorkspaceId as jest.Mock).mockImplementation(
  () => async () => clearWorkspaceIdMock(),
);
(workspacesActionCreators.setWorkspaceQualifiedName as jest.Mock).mockImplementation(
  (namespace: string, workspaceName: string) => async () =>
    setWorkspaceQualifiedName(namespace, workspaceName),
);

jest.mock('../../store/FactoryResolver');
const actualModule = jest.requireActual('../../store/FactoryResolver');
(isOAuthResponse as unknown as jest.Mock).mockImplementation(actualModule.isOAuthResponse);
(factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
  (
      location: string,
      overrideParams?: {
        [params: string]: string;
      },
    ) =>
    async () => {
      if (!overrideParams) {
        requestFactoryResolverMock(location);
      } else {
        requestFactoryResolverMock(location, overrideParams);
      }
    },
);

jest.mock('../../pages/FactoryLoader', () => {
  return function DummyWizard(props: {
    hasError: boolean;
    currentStep: LoadFactorySteps;
    workspaceName: string;
    workspaceId: string;
    resolvedDevfileMessage?: string;
    callbacks?: {
      showAlert?: (alertOptions: AlertOptions) => void;
    };
  }): React.ReactElement {
    if (props.callbacks) {
      props.callbacks.showAlert = showAlertMock;
    }
    return (
      <div>
        Dummy Wizard
        <div data-testid="factory-loader-has-error">{props.hasError.toString()}</div>
        <div data-testid="factory-loader-current-step">{props.currentStep}</div>
        <div data-testid="factory-loader-workspace-name">{props.workspaceName}</div>
        <div data-testid="factory-loader-workspace-id">{props.workspaceId}</div>
        <div data-testid="factory-loader-devfile-location-info">{props.resolvedDevfileMessage}</div>
      </div>
    );
  };
});

const namespace = 'che';

describe('Factory Loader container', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('default policy', () => {
    const component = FactoryLoaderContainer.WrappedComponent;
    const emptyProps = {
      history: {
        location: 'https://foo.location',
      },
    } as any;

    it('default policy in in Che Server mode is perclick', () => {
      const instance = new component({
        ...emptyProps,
        workspacesSettings: {
          'che.devworkspaces.enabled': 'false',
        },
      });
      expect(instance.state.createPolicy).toBe('perclick');
    });

    it('default policy in in DevWorkspaces mode is peruser', () => {
      const instance = new component({
        ...emptyProps,
        workspacesSettings: {
          'che.devworkspaces.enabled': 'true',
        },
      });
      expect(instance.state.createPolicy).toBe('peruser');
    });
  });

  describe('with prebuilt resources', () => {
    it('should start creating a devworkspace using pre-generated resources', async () => {
      const store = new FakeStoreBuilder()
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'true',
        } as che.WorkspaceSettings)
        .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
        .build();

      const location = 'http://test-location';
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, {
        url: location,
      });
      props.location.search += '&devWorkspace=devWorkspace.yaml';

      const yamlContent = `apiVersion: workspace.devfile.io/v1alpha2
kind: DevWorkspaceTemplate
metadata:
  name: theia-ide-project
---
apiVersion: workspace.devfile.io/v1alpha2
kind: DevWorkspace
metadata:
  name: project`;
      (mockAxios.get as jest.Mock).mockResolvedValueOnce(yamlContent);

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() => expect(createWorkspaceFromResourcesMock).toHaveBeenCalled());
    });
  });

  describe('Use a devfile V1', () => {
    it('should resolve the factory, create and start a new workspace', async () => {
      const location = 'http://test-location';
      const workspace = new CheWorkspaceBuilder()
        .withId('wrksp-test-id')
        .withName('wrksp-test-name')
        .build();
      const workspaceAdapter = convertWorkspace(workspace);

      renderComponentV1(location, workspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');

      await waitFor(() => expect(clearWorkspaceIdMock).toHaveBeenCalled());
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE],
      );

      jest.runOnlyPendingTimers();
      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE],
      );

      jest.runOnlyPendingTimers();
      await waitFor(() =>
        expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(
          workspace.devfile,
          undefined,
          namespace,
          { stackName: location + '/' },
        ),
      );
      expect(setWorkspaceQualifiedName).toHaveBeenCalledWith(
        namespace,
        workspace.devfile.metadata.name,
      );

      jest.runOnlyPendingTimers();
      await waitFor(() => expect(requestWorkspaceMock).toHaveBeenCalledWith(workspaceAdapter));
      await waitFor(() => expect(startWorkspaceMock).toHaveBeenCalledWith(workspaceAdapter));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.START_WORKSPACE],
      );
    });

    it('should resolve the factory, create a new workspace and open IDE', async () => {
      const location = 'http://test-location';
      const workspace = createFakeWorkspaceWithRuntimeV1('id-wksp-test');
      const workspaceAdapter = convertWorkspace(workspace);

      renderComponentV1(location, workspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');

      await waitFor(() => expect(clearWorkspaceIdMock).toHaveBeenCalled());
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE],
      );

      jest.runOnlyPendingTimers();
      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith(location));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE],
      );

      jest.runOnlyPendingTimers();
      await waitFor(() =>
        expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(
          workspace.devfile,
          undefined,
          namespace,
          { stackName: location + '/' },
        ),
      );
      expect(setWorkspaceQualifiedName).toHaveBeenCalledWith(
        namespace,
        workspace.devfile.metadata.name,
      );

      jest.runOnlyPendingTimers();
      expect(showAlertMock).toBeCalledWith({
        alertVariant: AlertVariant.warning,
        title:
          "You're starting an ephemeral workspace. All changes to the source code will be lost " +
          'when the workspace is stopped unless they are pushed to a remote code repository.',
      });
      expect(setWorkspaceIdMock).toHaveBeenCalledWith(workspace.id);
      await waitFor(() => expect(requestWorkspaceMock).toHaveBeenCalledWith(workspaceAdapter));
      await waitFor(() => expect(startWorkspaceMock).not.toHaveBeenCalled());

      jest.runOnlyPendingTimers();
      await waitFor(() => expect(requestWorkspaceMock).toHaveBeenCalledWith(workspaceAdapter));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.OPEN_IDE],
      );
    });

    it('should resolve the factory, create a new workspace with param overriding', async () => {
      const location = 'http://test-location&override.metadata.generateName=testPrefix';
      const workspace = createFakeWorkspaceWithRuntimeV1('id-wksp-test', location);
      renderComponentV1(location, workspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE],
      );

      jest.runOnlyPendingTimers();
      await waitFor(() =>
        expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0], {
          'override.metadata.generateName': 'testPrefix',
        }),
      );
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE],
      );

      jest.runOnlyPendingTimers();
      await waitFor(() =>
        expect(createWorkspaceFromDevfileMock).toHaveBeenCalledWith(
          {
            apiVersion: '1.0.0',
            metadata: {
              name: 'name-wksp-2',
            },
            attributes: { persistVolumes: 'false' },
          },
          undefined,
          namespace,
          { stackName: 'http://test-location/?override.metadata.generateName=testPrefix' },
        ),
      );
    });

    it('should show a target error with "error_code=invalid_request"', () => {
      const location = 'http://test-location&error_code=invalid_request';
      const workspace = createFakeWorkspaceWithRuntimeV1('id-wksp-test');

      renderComponentV1(location, workspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.INITIALIZING],
      );

      expect(showAlertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          alertVariant: 'danger',
          title:
            'Could not resolve devfile from private repository because authentication request is missing a parameter,' +
            ' contains an invalid parameter, includes a parameter more than once, or is otherwise invalid.',
        }),
      );
    });

    it('should show a target error with "error_code=access_denied"', () => {
      const location = 'http://test-location&error_code=access_denied';
      const workspace = createFakeWorkspaceWithRuntimeV1('id-wksp-test');

      renderComponentV1(location, workspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.INITIALIZING],
      );

      expect(showAlertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          alertVariant: 'danger',
          title:
            'Could not resolve devfile from private repository because the user or authorization server denied the authentication request.',
        }),
      );
    });

    it('should resolve the factory with "policies.create=peruser"', async () => {
      const location = 'http://test-location&policies.create=peruser';
      const workspace = createFakeWorkspaceWithRuntimeV1(
        'id-wksp-test',
        'http://test-location/?policies.create=peruser',
      );
      const workspaceAdapter = convertWorkspace(workspace);

      renderComponentV1(location, workspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE],
      );

      jest.runOnlyPendingTimers();
      await waitFor(() =>
        expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0]),
      );
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE],
      );

      jest.runOnlyPendingTimers();
      expect(createWorkspaceFromDevfileMock).not.toHaveBeenCalled();

      jest.runOnlyPendingTimers();
      await waitFor(() => expect(requestWorkspaceMock).toHaveBeenCalledWith(workspaceAdapter));
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.OPEN_IDE],
      );
    });

    it('should show an error if something wrong with Repository/Devfile URL', async () => {
      const message =
        'Repository/Devfile URL is missing. Please specify it via url query param: ' +
        window.location.origin +
        window.location.pathname +
        '#/load-factory?url= .';
      const workspace = createFakeWorkspaceWithRuntimeV1('id-wksp-test');
      renderComponentV1('', workspace);

      expect(requestFactoryResolverMock).not.toBeCalled();
      await waitFor(() =>
        expect(showAlertMock).toBeCalledWith({ alertVariant: AlertVariant.danger, title: message }),
      );
      const elementHasError = screen.getByTestId('factory-loader-has-error');
      expect(elementHasError.innerHTML).toEqual('true');

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.CREATE_WORKSPACE],
      );
    });
  });

  describe('Use a devfile V2', () => {
    it('should resolve the factory with create policy "peruser" and open existing workspace', async () => {
      const location = 'http://test-location&policies.create=peruser';
      const name = 'test-name';
      const devWorkspace = new DevWorkspaceBuilder()
        .withId('id-wksp-test')
        .withName(name)
        .withNamespace('test')
        .build();
      renderComponentV2(location, devWorkspace);

      const elementCurrentStep = screen.getByTestId('factory-loader-current-step');
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE],
      );

      jest.runOnlyPendingTimers();
      await waitFor(() =>
        expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0]),
      );
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE],
      );

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
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE],
      );

      jest.runOnlyPendingTimers();
      await waitFor(() =>
        expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0]),
      );
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE],
      );

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
                  'che.eclipse.org/devfile-source': safeDump({
                    factory: { params: 'url=http://test2-location&policies.create=peruser' },
                  }),
                },
              },
            },
            components: [],
          },
          undefined,
          undefined,
          {
            factoryParams: 'url=http://test2-location&policies.create=peruser',
            'policies.create': 'peruser',
          },
        ),
      );
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
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.LOOKING_FOR_DEVFILE],
      );

      jest.runOnlyPendingTimers();
      await waitFor(() =>
        expect(requestFactoryResolverMock).toHaveBeenCalledWith(location.split('&')[0]),
      );
      expect(LoadFactorySteps[elementCurrentStep.innerHTML]).toEqual(
        LoadFactorySteps[LoadFactorySteps.APPLYING_DEVFILE],
      );

      jest.runOnlyPendingTimers();

      await waitFor(() => expect(createWorkspaceFromDevfileMock).toHaveBeenCalledTimes(1));
    });
  });

  describe('Resolving a devfile', () => {
    it('should fail if request factory url fails', async () => {
      const location = 'my-repository-location';
      const errorMessage = '404. Not found';

      (factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
        () => async () => {
          throw new Error(errorMessage);
        },
      );

      const store = new FakeStoreBuilder().build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: location });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() =>
        expect(showAlertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching(`Failed to resolve a devfile. ${errorMessage}`),
          }),
        ),
      );
    });

    it('should fail if factory resolver url is different from requested url', async () => {
      const location = 'my-repository-location';
      const otherLocation = 'other-repository-location';

      (factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
        () => async () => {
          requestFactoryResolverMock(otherLocation);
        },
      );

      const store = new FakeStoreBuilder().build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: location });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() =>
        expect(showAlertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to resolve a devfile.',
          }),
        ),
      );
    });

    it('should provide message if raw content is resolved', async () => {
      const location = 'my-repository-location';

      (factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
        () => async () => {
          requestFactoryResolverMock();
        },
      );

      const store = new FakeStoreBuilder()
        .withFactoryResolver(
          {
            location,
          } as ResolverState,
          {
            isConverted: false,
          } as ConvertedState,
        )
        .build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: location });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalled());

      const devfileInfo = screen.getByTestId('factory-loader-devfile-location-info').textContent;
      expect(devfileInfo).toEqual(`Devfile loaded from ${location}.`);
    });

    it('should provide message if the default devfile is resolved', async () => {
      const location = 'my-repository-location';

      (factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
        () => async () => {
          requestFactoryResolverMock();
        },
      );

      const store = new FakeStoreBuilder()
        .withFactoryResolver(
          {
            location,
            source: 'repo',
          } as ResolverState,
          {
            isConverted: false,
          } as ConvertedState,
        )
        .build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: location });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalled());

      const devfileInfo = screen.getByTestId('factory-loader-devfile-location-info').textContent;
      expect(devfileInfo).toEqual(
        `Devfile could not be found in ${location}. Applying the default configuration.`,
      );
    });

    it('should provide message if the devfile converted from v1 to v2.x.x', async () => {
      const location = 'my-repository-location';

      (factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
        () => async () => {
          requestFactoryResolverMock();
        },
      );

      const store = new FakeStoreBuilder()
        .withFactoryResolver(
          {
            location,
          } as ResolverState,
          {
            isConverted: true,
          } as ConvertedState,
        )
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'false',
        })
        .build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: location });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalled());

      const devfileInfo = screen.getByTestId('factory-loader-devfile-location-info').textContent;
      expect(devfileInfo).toMatch('Devfile 2.x version found, converting it to devfile version 1.');
    });

    it('should provide message if the devfile converted from v2.x.x to v1', async () => {
      const location = 'https://my-repository-location';

      (factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
        () => async () => {
          requestFactoryResolverMock();
        },
      );

      const devfile = {
        schemaVersion: '2.3.4',
        metadata: {
          name: 'my-project',
        },
      } as devfileApi.Devfile;

      const store = new FakeStoreBuilder()
        .withFactoryResolver(
          {
            devfile,
            location,
          } as ResolverState,
          {
            isConverted: true,
          } as ConvertedState,
        )
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'true',
        })
        .build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: location });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalled());

      const devfileInfo = screen.getByTestId('factory-loader-devfile-location-info').textContent;
      expect(devfileInfo).toMatch(
        `Devfile version 1 found, converting it to devfile version ${devfile.schemaVersion}.`,
      );
    });

    it('should not provide message if devfile v1 is not converted', async () => {
      const location = 'https://my-repository-location';

      (factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
        () => async () => {
          requestFactoryResolverMock();
        },
      );

      const devfile = {
        apiVersion: '1.0.0',
        metadata: {
          name: 'my-project',
        },
      } as che.WorkspaceDevfile;

      const store = new FakeStoreBuilder()
        .withFactoryResolver(
          {
            devfile,
            location,
          } as ResolverState,
          {
            isConverted: false,
          } as ConvertedState,
        )
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'false',
        })
        .build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: location });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalled());

      const devfileInfo = screen.getByTestId('factory-loader-devfile-location-info').textContent;
      expect(devfileInfo).not.toMatch(`Devfile version 1 found, converting it`);
    });

    it('should not provide message if devfile v2.x.x is not converted', async () => {
      const location = 'https://my-repository-location';

      (factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
        () => async () => {
          requestFactoryResolverMock();
        },
      );

      const devfile = {
        schemaVersion: '2.3.4',
        metadata: {
          name: 'my-project',
        },
      } as devfileApi.Devfile;

      const store = new FakeStoreBuilder()
        .withFactoryResolver(
          {
            devfile,
            location,
          } as ResolverState,
          {
            isConverted: false,
          } as ConvertedState,
        )
        .withWorkspacesSettings({
          'che.devworkspaces.enabled': 'true',
        })
        .build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: location });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalled());

      const devfileInfo = screen.getByTestId('factory-loader-devfile-location-info').textContent;
      expect(devfileInfo).not.toMatch(
        `Devfile version 1 found, converting it to devfile version 1.`,
      );
    });
  });

  describe('Resolving a private repository devfile', () => {
    it('should handle the the namespace absence', async () => {
      const location = 'private-repository-location';

      (factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
        () => async () => {
          throw {
            attributes: {
              oauth_provider: 'oauth_provider',
              oauth_authentication_url: 'oauth_authentication_url',
            },
          };
        },
      );

      const store = new FakeStoreBuilder().build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: location });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() =>
        expect(showAlertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching('The infrastructure namespace is required to be created.'),
          }),
        ),
      );
    });

    it('should redirect to login page', async () => {
      const privateRepoUrl = 'https://my-private.repo';
      const oauthAuthenticationUrl = 'https://oauth_authentication_url';
      const host = 'che-host';
      const protocol = 'http://';
      delete (window as any).location;
      (window.location as any) = {
        host,
        protocol,
      };
      Object.defineProperty(window.location, 'href', {
        set: () => {
          // no-op
        },
        configurable: true,
      });
      const spy = jest.spyOn(window.location, 'href', 'set');

      (factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
        () => async () => {
          throw {
            attributes: {
              oauth_provider: 'oauth_provider',
              oauth_authentication_url: oauthAuthenticationUrl,
            },
          };
        },
      );

      const store = new FakeStoreBuilder()
        .withInfrastructureNamespace([{ name: 'user-che', attributes: { phase: 'Active' } }])
        .build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: privateRepoUrl });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      const expectedRedirectUrl = `${oauthAuthenticationUrl}/&redirect_after_login=${protocol}${host}/f?url=${encodeURIComponent(
        privateRepoUrl,
      )}`;

      await waitFor(() => expect(spy).toHaveBeenCalledWith(expectedRedirectUrl));
    });
  });
});

function renderComponentV2(url: string, workspace: devfileApi.DevWorkspace): RenderResult {
  const wrks = convertWorkspace(workspace);
  (wrks.ref as devfileApi.DevWorkspace).metadata.annotations = {
    'che.eclipse.org/devfile-source': safeDump({
      factory: { params: 'url=http://test-location&policies.create=peruser' },
    }),
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
    .withFactoryResolver(
      {
        v: '4.0',
        source: 'devfile.yaml',
        devfile: convertWorkspace(workspace).devfile,
        location: url.split('&')[0],
        scm_info: {
          clone_url: 'http://github.com/clone-url',
          scm_provider: 'github',
        },
        links: [],
      },
      {
        isConverted: false,
      } as ConvertedState,
    )
    .build();
  const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url });

  return render(
    <Provider store={store}>
      <FactoryLoaderContainer {...props} />
    </Provider>,
  );
}

function renderComponentV1(
  url: string,
  workspace: che.Workspace,
  preferredStorageType?: che.WorkspaceStorageType,
): RenderResult {
  const settings = preferredStorageType
    ? { 'che.workspace.storage.preferred_type': preferredStorageType }
    : {};
  const store = new FakeStoreBuilder()
    .withCheWorkspaces({
      workspaces: [workspace],
    })
    .withWorkspaces({
      workspaceId: workspace.id,
      namespace: namespace,
      workspaceName: workspace.devfile.metadata.name,
    })
    .withWorkspacesSettings(settings as che.WorkspaceSettings)
    .withFactoryResolver(
      {
        v: '4.0',
        source: 'devfile.yaml',
        devfile: workspace.devfile as che.WorkspaceDevfile,
        location: url.split('&')[0],
        links: [],
      },
      {
        isConverted: false,
      } as ConvertedState,
    )
    .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
    .build();
  const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url });

  return render(
    <Provider store={store}>
      <FactoryLoaderContainer {...props} />
    </Provider>,
  );
}

function createFakeWorkspaceWithRuntimeV1(
  workspaceId: string,
  stackName = '',
  workspaceName = 'name-wksp-2',
  attributes: che.WorkspaceDevfileAttributes = { persistVolumes: 'false' },
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
    },
  );
  workspace.devfile.attributes = attributes;
  if (!workspace.attributes) {
    workspace.attributes = {
      infrastructureNamespace: '',
      created: '',
    };
  }
  workspace.attributes.stackName = stackName;

  return workspace;
}
