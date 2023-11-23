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

/* eslint-disable @typescript-eslint/no-unused-vars */

import { api } from '@eclipse-che/common';
import { V1Status } from '@kubernetes/client-node';
import { dump } from 'js-yaml';
import { AnyAction } from 'redux';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import { container } from '@/inversify.config';
import { fetchServerConfig } from '@/services/backend-client/serverConfigApi';
import { WebsocketClient } from '@/services/backend-client/websocketClient';
import devfileApi from '@/services/devfileApi';
import { DEVWORKSPACE_STORAGE_TYPE_ATTR } from '@/services/devfileApi/devWorkspace/spec/template';
import { FactoryParams } from '@/services/helpers/factoryFlow/buildFactoryParams';
import { DevWorkspaceClient } from '@/services/workspace-client/devworkspace/devWorkspaceClient';
import { AppState } from '@/store';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';
import * as ServerConfigStore from '@/store/ServerConfig';
import { checkRunningWorkspacesLimit } from '@/store/Workspaces/devWorkspaces/checkRunningWorkspacesLimit';

import * as testStore from '..';

jest.mock('../../../../services/backend-client/serverConfigApi');
jest.mock('../../../../services/helpers/delay', () => ({
  delay: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../checkRunningWorkspacesLimit.ts');

jest.mock('../../../../services/backend-client/devworkspaceResourcesApi', () => ({
  fetchResources: () => `
apiVersion: workspace.devfile.io/v1alpha2
kind: DevWorkspaceTemplate
metadata:
  name: che-code
spec:
  components:
    - name: che-code-runtime-description
      container:
        image: quay.io/devfile/universal-developer-image:next
        endpoints:
          - name: che-code
            attributes:
              type: main
              cookiesAuthEnabled: true
              discoverable: false
              urlRewriteSupported: true
            targetPort: 3100
            exposure: public
            secure: false
            protocol: https
          - name: code-redirect-1
            attributes:
              discoverable: false
              urlRewriteSupported: false
            targetPort: 13131
            exposure: public
            protocol: http
          - name: code-redirect-2
            attributes:
              discoverable: false
              urlRewriteSupported: false
            targetPort: 13132
            exposure: public
            protocol: http
          - name: code-redirect-3
            attributes:
              discoverable: false
              urlRewriteSupported: false
            targetPort: 13133
            exposure: public
            protocol: http
---
apiVersion: workspace.devfile.io/v1alpha2
kind: DevWorkspace
metadata:
  name: che
spec:
  routingClass: che
  template:
    components: []
`,
}));

const mockPatchTemplate = jest.fn();
jest.mock('../../../../services/backend-client/devWorkspaceTemplateApi', () => ({
  getTemplates: () => [
    {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'DevWorkspaceTemplate',
      metadata: {
        name: 'che-code',
        namespace: 'test-che',
        ownerReferences: [{ uid: 'testDevWorkspaceUID' }],
      },
    },
  ],
  patchTemplate: (templateNamespace, templateName, targetTemplatePatch) =>
    mockPatchTemplate(templateNamespace, templateName, targetTemplatePatch),
}));
const mockPatchWorkspace = jest.fn();
jest.mock('../../../../services/backend-client/devWorkspaceApi', () => ({
  patchWorkspace: (namespace, workspaceName, patch) =>
    mockPatchWorkspace(namespace, workspaceName, patch),
}));

// DevWorkspaceClient mocks
const mockChangeWorkspaceStatus = jest.fn();
const mockCheckForDevWorkspaceError = jest.fn();
const mockCreateDevWorkspace = jest.fn();
const mockCreateDevWorkspaceTemplate = jest.fn();
const mockUpdateDevWorkspace = jest.fn();
const mockDelete = jest.fn();
const mockGetAllWorkspaces = jest.fn();
const mockGetWorkspaceByName = jest.fn();
const mockManageContainerBuildAttribute = jest.fn();
const mockManageDebugMode = jest.fn();
const mockManagePvcStrategy = jest.fn();
const mockOnStart = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateAnnotation = jest.fn();

describe('DevWorkspace store, actions', () => {
  const devWorkspaceClient = container.get(DevWorkspaceClient);
  let storeBuilder: FakeStoreBuilder;
  let store: MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
  beforeEach(() => {
    container.snapshot();
    devWorkspaceClient.changeWorkspaceStatus = mockChangeWorkspaceStatus;
    devWorkspaceClient.checkForDevWorkspaceError = mockCheckForDevWorkspaceError;
    devWorkspaceClient.createDevWorkspace = mockCreateDevWorkspace;
    devWorkspaceClient.createDevWorkspaceTemplate = mockCreateDevWorkspaceTemplate;
    devWorkspaceClient.updateDevWorkspace = mockUpdateDevWorkspace;
    devWorkspaceClient.delete = mockDelete;
    devWorkspaceClient.getAllWorkspaces = mockGetAllWorkspaces;
    devWorkspaceClient.getWorkspaceByName = mockGetWorkspaceByName;
    devWorkspaceClient.manageContainerBuildAttribute = mockManageContainerBuildAttribute;
    devWorkspaceClient.manageDebugMode = mockManageDebugMode;
    devWorkspaceClient.managePvcStrategy = mockManagePvcStrategy;
    devWorkspaceClient.onStart = mockOnStart;
    devWorkspaceClient.update = mockUpdate;
    devWorkspaceClient.updateAnnotation = mockUpdateAnnotation;

    storeBuilder = new FakeStoreBuilder().withInfrastructureNamespace([
      { name: 'user-che', attributes: { default: 'true', phase: 'Active' } },
    ]);
    store = storeBuilder
      .withDwServerConfig({
        defaults: {
          editor: 'che-incubator/che-code/latest',
        },
        pluginRegistryURL: 'https://dummy.registry',
      } as api.IServerConfig)
      .withDevfileRegistries({
        devfiles: {
          ['https://dummy.registry/plugins/che-incubator/che-code/latest/devfile.yaml']: {
            content: dump(new DevWorkspaceBuilder().build()),
          },
        },
      })
      .build();
  });

  afterEach(() => {
    container.restore();
    jest.resetAllMocks();
  });

  describe('requestWorkspaces', () => {
    it('should create REQUEST_DEVWORKSPACE and RECEIVE_DEVWORKSPACE when fetching DevWorkspaces', async () => {
      mockGetAllWorkspaces.mockResolvedValueOnce({ workspaces: [], resourceVersion: '' });

      await store.dispatch(testStore.actionCreators.requestWorkspaces());
      const actions = store.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.RECEIVE_DEVWORKSPACE,
          workspaces: [],
          resourceVersion: '',
        },
        {
          type: testStore.Type.UPDATE_STARTED_WORKSPACES,
          workspaces: [],
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create REQUEST_DEVWORKSPACE, RECEIVE_DEVWORKSPACE and UPDATE_DEVWORKSPACE when fetching DevWorkspaces', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      mockGetAllWorkspaces.mockResolvedValueOnce({
        workspaces: [devWorkspace],
        resourceVersion: '1234',
      });
      mockUpdate.mockResolvedValueOnce(devWorkspace);

      await store.dispatch(testStore.actionCreators.requestWorkspaces());
      const actions = store.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.RECEIVE_DEVWORKSPACE,
          resourceVersion: '1234',
          workspaces: [devWorkspace],
        },
        {
          type: testStore.Type.UPDATE_STARTED_WORKSPACES,
          workspaces: [devWorkspace],
        },
        {
          check: AUTHORIZED,
          type: testStore.Type.REQUEST_DEVWORKSPACE,
        },
        {
          type: testStore.Type.UPDATE_DEVWORKSPACE,
          workspace: devWorkspace,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create REQUEST_DEVWORKSPACE and RECEIVE_DEVWORKSPACE_ERROR when fails to fetch DevWorkspaces', async () => {
      mockGetAllWorkspaces.mockRejectedValueOnce(new Error('Something unexpected happened.'));

      try {
        await store.dispatch(testStore.actionCreators.requestWorkspaces());
      } catch (e) {
        // noop
      }

      const actions = store.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: 'Failed to fetch available workspaces, reason: Something unexpected happened.',
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });
  });

  describe('requestWorkspace', () => {
    it('should create REQUEST_DEVWORKSPACE and UPDATE_DEVWORKSPACE when updating DevWorkspace', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      mockGetWorkspaceByName.mockResolvedValueOnce(devWorkspace);
      mockUpdate.mockResolvedValueOnce(devWorkspace);

      await store.dispatch(testStore.actionCreators.requestWorkspace(devWorkspace));
      const actions = store.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.UPDATE_DEVWORKSPACE,
          workspace: devWorkspace,
        },
        {
          check: AUTHORIZED,
          type: testStore.Type.REQUEST_DEVWORKSPACE,
        },
        {
          type: testStore.Type.UPDATE_DEVWORKSPACE,
          workspace: devWorkspace,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create REQUEST_DEVWORKSPACE and RECEIVE_DEVWORKSPACE_ERROR when fails to fetch a DevWorkspace', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      mockGetWorkspaceByName.mockRejectedValueOnce(new Error('Something unexpected happened.'));

      try {
        await store.dispatch(testStore.actionCreators.requestWorkspace(devWorkspace));
      } catch (e) {
        // noop
      }

      const actions = store.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: `Failed to fetch the workspace ${devWorkspace.metadata.name}, reason: Something unexpected happened.`,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });
  });

  describe('startWorkspace', () => {
    it('should create REQUEST_DEVWORKSPACE and UPDATE_DEVWORKSPACE when starting DevWorkspace', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      (checkRunningWorkspacesLimit as jest.Mock).mockImplementation(() => undefined);

      (fetchServerConfig as jest.Mock).mockResolvedValueOnce({});

      mockChangeWorkspaceStatus.mockResolvedValueOnce(devWorkspace);
      mockManageContainerBuildAttribute.mockResolvedValueOnce(devWorkspace);
      mockManageDebugMode.mockResolvedValueOnce(devWorkspace);
      mockManagePvcStrategy.mockResolvedValueOnce(devWorkspace);
      mockOnStart.mockResolvedValueOnce(devWorkspace);
      mockUpdate.mockResolvedValueOnce(devWorkspace);
      mockOnStart.mockResolvedValueOnce(devWorkspace);
      mockCheckForDevWorkspaceError.mockReturnValueOnce(devWorkspace);

      const store = storeBuilder.withDevWorkspaces({ workspaces: [devWorkspace] }).build();

      await store.dispatch(testStore.actionCreators.startWorkspace(devWorkspace));

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction | ServerConfigStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          check: AUTHORIZED,
          type: 'REQUEST_DW_SERVER_CONFIG',
        },
        {
          config: {} as api.IServerConfig,
          type: 'RECEIVE_DW_SERVER_CONFIG',
        },
        {
          type: testStore.Type.UPDATE_DEVWORKSPACE,
          workspace: devWorkspace,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create REQUEST_DEVWORKSPACE and RECEIVE_DEVWORKSPACE_ERROR when failed to start a DevWorkspace', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      (checkRunningWorkspacesLimit as jest.Mock).mockImplementation(() => {
        throw new Error('Limit reached.');
      });

      mockChangeWorkspaceStatus.mockResolvedValueOnce(devWorkspace);
      mockManageContainerBuildAttribute.mockResolvedValueOnce(devWorkspace);
      mockManageDebugMode.mockResolvedValueOnce(devWorkspace);
      mockManagePvcStrategy.mockResolvedValueOnce(devWorkspace);
      mockOnStart.mockResolvedValueOnce(devWorkspace);
      mockUpdate.mockResolvedValueOnce(devWorkspace);
      mockOnStart.mockResolvedValueOnce(devWorkspace);
      mockCheckForDevWorkspaceError.mockReturnValueOnce(devWorkspace);

      const store = storeBuilder.withDevWorkspaces({ workspaces: [devWorkspace] }).build();

      try {
        await store.dispatch(testStore.actionCreators.startWorkspace(devWorkspace));
      } catch (e) {
        // no-op
      }

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction | ServerConfigStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: `Failed to start the workspace ${devWorkspace.metadata.name}, reason: Limit reached.`,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });
  });

  describe('updateWorkspaceWithDefaultDevfile', () => {
    const timestampNew = '2023-08-15T11:59:18.331Z';
    beforeEach(() => {
      class MockDate extends Date {
        constructor() {
          super(timestampNew);
        }
      }
      window.Date = MockDate as DateConstructor;
    });

    it('should create REQUEST_DEVWORKSPACE and UPDATE_DEVWORKSPACE when update DevWorkspace with default devfile', async () => {
      const devWorkspace = new DevWorkspaceBuilder()
        .withName('dev-wksp')
        .withNamespace('test-che')
        .withUID('testDevWorkspaceUID')
        .build();

      mockPatchTemplate.mockResolvedValueOnce({});
      mockPatchWorkspace.mockResolvedValueOnce({ devWorkspace: devWorkspace });

      const store = storeBuilder
        .withDevWorkspaces({ workspaces: [devWorkspace] })
        .withDevfileRegistries({
          registries: {
            ['https://registry-url']: {
              metadata: [
                {
                  displayName: 'Empty Workspace',
                  description: 'Start an empty remote development environment',
                  tags: ['Empty'],
                  icon: '/images/empty.svg',
                  links: {
                    v2: 'https://resources-url',
                  },
                } as che.DevfileMetaData,
              ],
            },
          },
          devfiles: {
            ['https://resources-url']: {
              content: dump({
                schemaVersion: '2.1.0',
                metadata: {
                  generateName: 'empty',
                },
              } as devfileApi.Devfile),
            },
            'https://dummy.registry/plugins/che-incubator/che-code/latest/devfile.yaml': {
              content: dump({
                apiVersion: 'workspace.devfile.io/v1alpha2',
                kind: 'DevWorkspaceTemplate',
                metadata: {
                  name: 'che-code',
                },
                spec: {
                  components: [],
                },
              }),
            },
          },
        })
        .withDwPlugins({}, false, undefined, 'che-incubator/che-code/latest')
        .build();

      await store.dispatch(
        testStore.actionCreators.updateWorkspaceWithDefaultDevfile(devWorkspace),
      );

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction | ServerConfigStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.UPDATE_DEVWORKSPACE,
          workspace: devWorkspace,
        },
      ];

      expect(mockPatchTemplate).toHaveBeenCalledWith('test-che', 'che-code', [
        {
          op: 'add',
          path: '/metadata/annotations',
          value: {
            'che.eclipse.org/components-update-policy': 'managed',
            'che.eclipse.org/plugin-registry-url':
              'https://dummy.registry/plugins/che-incubator/che-code/latest/devfile.yaml',
          },
        },
        {
          op: 'replace',
          path: '/spec',
          value: {
            components: [
              {
                name: 'che-code-runtime-description',
                container: {
                  image: 'quay.io/devfile/universal-developer-image:next',
                  endpoints: [
                    {
                      name: 'che-code',
                      attributes: {
                        type: 'main',
                        discoverable: false,
                        cookiesAuthEnabled: true,
                        urlRewriteSupported: true,
                      },
                      targetPort: 3100,
                      exposure: 'public',
                      secure: false,
                      protocol: 'https',
                    },
                  ],
                  env: [
                    {
                      name: 'CHE_DASHBOARD_URL',
                      value: 'http://localhost',
                    },
                    {
                      name: 'CHE_PLUGIN_REGISTRY_URL',
                      value: 'https://dummy.registry',
                    },
                    {
                      name: 'CHE_PLUGIN_REGISTRY_INTERNAL_URL',
                      value: '',
                    },
                    {
                      name: 'OPENVSX_REGISTRY_URL',
                      value: '',
                    },
                  ],
                },
              },
            ],
          },
        },
      ]);
      expect(mockPatchWorkspace).toHaveBeenCalledWith('test-che', 'dev-wksp', [
        {
          op: 'replace',
          path: '/metadata/annotations',
          value: {
            'che.eclipse.org/che-editor': 'che-incubator/che-code/latest',
            'che.eclipse.org/last-updated-timestamp': '2023-08-15T11:59:18.331Z',
          },
        },
        {
          op: 'replace',
          path: '/spec',
          value: {
            contributions: undefined,
            routingClass: 'che',
            started: false,
            template: {
              components: [],
              projects: undefined,
            },
          },
        },
      ]);
      expect(actions).toStrictEqual(expectedActions);
    });
  });

  describe('stopWorkspace', () => {
    it('should create no actions', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      mockChangeWorkspaceStatus.mockResolvedValueOnce(devWorkspace);

      await store.dispatch(testStore.actionCreators.stopWorkspace(devWorkspace));

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [];

      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create RECEIVE_DEVWORKSPACE_ERROR when fails to stop DevWorkspace', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      mockChangeWorkspaceStatus.mockRejectedValueOnce(new Error('Something unexpected happened.'));

      try {
        await store.dispatch(testStore.actionCreators.stopWorkspace(devWorkspace));
      } catch (e) {
        // no-op
      }

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: `Failed to stop the workspace ${devWorkspace.metadata.name}, reason: Something unexpected happened.`,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });
  });

  describe('terminateWorkspace', () => {
    it('should create TERMINATE_DEVWORKSPACE when succeeded to terminate a DevWorkspace', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      mockDelete.mockResolvedValueOnce(undefined);

      await store.dispatch(testStore.actionCreators.terminateWorkspace(devWorkspace));

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          message: 'Cleaning up resources for deletion',
          type: testStore.Type.TERMINATE_DEVWORKSPACE,
          workspaceUID: devWorkspace.metadata.uid,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create RECEIVE_DEVWORKSPACE_ERROR when fails to terminate a DevWorkspace', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      mockDelete.mockRejectedValueOnce('Something unexpected happened.');

      try {
        await store.dispatch(testStore.actionCreators.terminateWorkspace(devWorkspace));
      } catch (e) {
        // no-op
      }

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: `Failed to delete the workspace ${devWorkspace.metadata.name}, reason: Something unexpected happened.`,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });
  });

  describe('updateWorkspaceAnnotation', () => {
    it('should create REQUEST_DEVWORKSPACE and UPDATE_DEVWORKSPACE when updating a workspace annotation', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      mockUpdateAnnotation.mockResolvedValueOnce(devWorkspace);

      await store.dispatch(testStore.actionCreators.updateWorkspaceAnnotation(devWorkspace));

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.UPDATE_DEVWORKSPACE,
          workspace: devWorkspace,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create REQUEST_DEVWORKSPACE and RECEIVE_DEVWORKSPACE_ERROR when fails to update a workspace annotation', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      mockUpdateAnnotation.mockRejectedValueOnce(new Error('Something unexpected happened.'));

      try {
        await store.dispatch(testStore.actionCreators.updateWorkspaceAnnotation(devWorkspace));
      } catch (e) {
        // no-op
      }

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          error: `Failed to update the workspace ${devWorkspace.metadata.name}, reason: Something unexpected happened.`,
          type: testStore.Type.RECEIVE_DEVWORKSPACE_ERROR,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });
  });

  describe('updateWorkspace', () => {
    it('should create REQUEST_DEVWORKSPACE and UPDATE_DEVWORKSPACE when updating a workspace annotation', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      mockUpdate.mockResolvedValueOnce(devWorkspace);

      await store.dispatch(testStore.actionCreators.updateWorkspace(devWorkspace));

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.UPDATE_DEVWORKSPACE,
          workspace: devWorkspace,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create REQUEST_DEVWORKSPACE and RECEIVE_DEVWORKSPACE_ERROR when fails to update a workspace annotation', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      mockUpdate.mockRejectedValueOnce(new Error('Something unexpected happened.'));

      try {
        await store.dispatch(testStore.actionCreators.updateWorkspace(devWorkspace));
      } catch (e) {
        // no-op
      }

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          error: `Failed to update the workspace ${devWorkspace.metadata.name}, reason: Something unexpected happened.`,
          type: testStore.Type.RECEIVE_DEVWORKSPACE_ERROR,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });
  });

  describe('createWorkspaceFromResources', () => {
    it('should create ADD_DEVWORKSPACE when creating a new workspace from resources', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();
      const devWorkspaceTemplate: devfileApi.DevWorkspaceTemplate = {
        apiVersion: 'v1alpha2',
        kind: 'DevWorkspaceTemplate',
        metadata: {
          name: 'template',
          namespace: 'user-che',
          annotations: {},
        },
      };

      mockCreateDevWorkspace.mockResolvedValueOnce({
        headers: { warning: 'Unsupported Devfile feature' },
        devWorkspace,
      });
      mockCreateDevWorkspaceTemplate.mockResolvedValueOnce({ headers: {}, devWorkspaceTemplate });
      mockCreateDevWorkspace.mockResolvedValueOnce({ headers: {}, devWorkspace });
      mockUpdateDevWorkspace.mockResolvedValueOnce({ headers: {}, devWorkspace });
      mockOnStart.mockResolvedValueOnce(undefined);

      await store.dispatch(
        testStore.actionCreators.createWorkspaceFromResources(devWorkspace, devWorkspaceTemplate),
      );

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.UPDATE_WARNING,
          workspace: devWorkspace,
          warning: 'Unsupported Devfile feature',
        },
        {
          type: testStore.Type.ADD_DEVWORKSPACE,
          workspace: devWorkspace,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create RECEIVE_DEVWORKSPACE_ERROR when fails to create a new workspace from resources', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();
      const devWorkspaceTemplate: devfileApi.DevWorkspaceTemplate = {
        apiVersion: 'v1alpha2',
        kind: 'DevWorkspaceTemplate',
        metadata: {
          name: 'template',
          namespace: 'user-che',
          annotations: {},
        },
      };

      mockCreateDevWorkspace.mockRejectedValueOnce(new Error('Something unexpected happened.'));

      try {
        await store.dispatch(
          testStore.actionCreators.createWorkspaceFromResources(devWorkspace, devWorkspaceTemplate),
        );
      } catch (e) {
        // no-op
      }

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          error: `Failed to create a new workspace, reason: Something unexpected happened.`,
          type: testStore.Type.RECEIVE_DEVWORKSPACE_ERROR,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });
  });

  describe('createWorkspaceFromDevfile', () => {
    it('should create ADD_DEVWORKSPACE when creating a new workspace from devfile', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();
      const devWorkspaceTemplate: devfileApi.DevWorkspaceTemplate = {
        apiVersion: 'v1alpha2',
        kind: 'DevWorkspaceTemplate',
        metadata: {
          name: 'template',
          namespace: 'user-che',
          annotations: {},
        },
      };

      mockCreateDevWorkspace.mockResolvedValueOnce({ headers: {}, devWorkspace });
      mockCreateDevWorkspaceTemplate.mockResolvedValueOnce({ headers: {}, devWorkspaceTemplate });
      mockUpdateDevWorkspace.mockResolvedValueOnce({ headers: {}, devWorkspace });
      mockOnStart.mockResolvedValueOnce(undefined);

      const devfile: devfileApi.Devfile = {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'che-dashboard',
          namespace: 'admin-che',
        },
        components: [
          {
            name: 'tools',
            container: {
              image: 'quay.io/devfile/universal-developer-image:ubi8',
            },
          },
        ],
      };
      await store.dispatch(testStore.actionCreators.createWorkspaceFromDevfile(devfile, {}, {}));

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.ADD_DEVWORKSPACE,
          workspace: devWorkspace,
        },
      ];

      expect(mockCreateDevWorkspace.mock.calls).toEqual([
        expect.arrayContaining([
          {
            apiVersion: 'workspace.devfile.io/v1alpha2',
            kind: 'DevWorkspace',
            metadata: {
              annotations: {},
              name: 'che',
            },
            spec: {
              routingClass: 'che',
              template: {
                components: [],
              },
            },
          },
        ]),
      ]);
      expect(mockCreateDevWorkspaceTemplate.mock.calls).toEqual([
        expect.arrayContaining([
          expect.objectContaining({
            apiVersion: 'workspace.devfile.io/v1alpha2',
            kind: 'DevWorkspaceTemplate',
            metadata: {
              name: 'che-code',
              annotations: {
                'che.eclipse.org/components-update-policy': 'managed',
                'che.eclipse.org/plugin-registry-url':
                  'https://dummy.registry/plugins/che-incubator/che-code/latest/devfile.yaml',
              },
            },
          }),
        ]),
      ]);
      expect(mockOnStart.mock.calls).toEqual([]);
      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create REQUEST_DEVWORKSPACE and RECEIVE_DEVWORKSPACE_ERROR when fails to create a new workspace from devfile', async () => {
      const devfile: devfileApi.Devfile = {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'test',
          namespace: 'user-che',
        },
      };
      const attr: Partial<FactoryParams> = {};

      mockCreateDevWorkspace.mockRejectedValueOnce(new Error('Something unexpected happened.'));

      try {
        await store.dispatch(
          testStore.actionCreators.createWorkspaceFromDevfile(devfile, attr, {}),
        );
      } catch (e) {
        // no-op
      }

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.REQUEST_DEVWORKSPACE,
          check: AUTHORIZED,
        },
        {
          error: 'Failed to create a new workspace, reason: Something unexpected happened.',
          type: testStore.Type.RECEIVE_DEVWORKSPACE_ERROR,
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });
  });

  describe('handleWebSocketMessage', () => {
    it('should create ADD_DEVWORKSPACE when event phase equals ADDED', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      await store.dispatch(
        testStore.actionCreators.handleWebSocketMessage({
          eventPhase: api.webSocket.EventPhase.ADDED,
          devWorkspace,
        }),
      );

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.ADD_DEVWORKSPACE,
          workspace: devWorkspace,
        },
        {
          type: testStore.Type.UPDATE_STARTED_WORKSPACES,
          workspaces: [devWorkspace],
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create UPDATE_DEVWORKSPACE when event phase equals MODIFIED', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      await store.dispatch(
        testStore.actionCreators.handleWebSocketMessage({
          eventPhase: api.webSocket.EventPhase.MODIFIED,
          devWorkspace,
        }),
      );

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.UPDATE_DEVWORKSPACE,
          workspace: devWorkspace,
        },
        {
          type: testStore.Type.UPDATE_STARTED_WORKSPACES,
          workspaces: [devWorkspace],
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create DELETE_DEVWORKSPACE when event phase equals DELETED', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      await store.dispatch(
        testStore.actionCreators.handleWebSocketMessage({
          eventPhase: api.webSocket.EventPhase.DELETED,
          devWorkspace,
        }),
      );

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction> = [
        {
          type: testStore.Type.DELETE_DEVWORKSPACE,
          workspace: devWorkspace,
        },
        {
          type: testStore.Type.UPDATE_STARTED_WORKSPACES,
          workspaces: [devWorkspace],
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
    });

    it('should create REQUEST_DEVWORKSPACE and RECEIVE_DEVWORKSPACE and resubscribe to channel', async () => {
      mockGetAllWorkspaces.mockResolvedValueOnce({ workspaces: [], resourceVersion: '123' });

      const websocketClient = container.get(WebsocketClient);
      const unsubscribeFromChannelSpy = jest
        .spyOn(websocketClient, 'unsubscribeFromChannel')
        .mockReturnValue(undefined);
      const subscribeToChannelSpy = jest
        .spyOn(websocketClient, 'subscribeToChannel')
        .mockReturnValue(undefined);

      const namespace = 'user-che';
      const appStoreWithNamespace = new FakeStoreBuilder()
        .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }])
        .build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, testStore.KnownAction>
      >;
      await appStoreWithNamespace.dispatch(
        testStore.actionCreators.handleWebSocketMessage({
          status: {
            code: 410,
            message: 'The resourceVersion for the provided watch is too old.',
          } as V1Status,
          eventPhase: api.webSocket.EventPhase.ERROR,
          params: { namespace, resourceVersion: '123' },
        }),
      );

      const actions = appStoreWithNamespace.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          check: AUTHORIZED,
          type: testStore.Type.REQUEST_DEVWORKSPACE,
        },
        {
          type: testStore.Type.RECEIVE_DEVWORKSPACE,
          workspaces: [],
          resourceVersion: '123',
        },
        {
          type: testStore.Type.UPDATE_STARTED_WORKSPACES,
          workspaces: [],
        },
      ];

      expect(actions).toStrictEqual(expectedActions);
      expect(unsubscribeFromChannelSpy).toHaveBeenCalledWith(api.webSocket.Channel.DEV_WORKSPACE);
      expect(subscribeToChannelSpy).toHaveBeenCalledWith(
        api.webSocket.Channel.DEV_WORKSPACE,
        namespace,
        { getResourceVersion: expect.any(Function) },
      );
    });
  });
});
