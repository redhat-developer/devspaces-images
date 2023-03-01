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

/* eslint-disable @typescript-eslint/no-unused-vars */

import { AnyAction } from 'redux';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';
import * as testStore from '../';
import { AppState } from '../../..';
import { container } from '../../../../inversify.config';
import devfileApi from '../../../../services/devfileApi';
import { DevWorkspaceClient } from '../../../../services/workspace-client/devworkspace/devWorkspaceClient';
import { AUTHORIZED } from '../../../sanityCheckMiddleware';
import { DevWorkspaceBuilder } from '../../../__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../__mocks__/storeBuilder';
import { api } from '@eclipse-che/common';
import * as pluginRegistryStore from '../../../Plugins/devWorkspacePlugins';

jest.mock('../../../../services/registry/fetchData', () => ({
  fetchData: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../../services/dashboard-backend-client/serverConfigApi.ts');
jest.mock('../../../../services/helpers/delay', () => ({
  delay: jest.fn().mockResolvedValue(undefined),
}));

// DevWorkspaceClient mocks
const mockCreateFromDevfile = jest.fn();

describe('DevWorkspace store, actions', () => {
  const devWorkspaceClient = container.get(DevWorkspaceClient);

  let storeBuilder: FakeStoreBuilder;
  let store: MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;

  const defaultEditorId = 'default-editor-id';
  const defaultEditorPlugins = ['default-plugin-id-1', 'default-plugin-id-2'];
  const pluginRegistryUrl = 'plugin-registry-url';

  beforeEach(() => {
    container.snapshot();
    devWorkspaceClient.createFromDevfile = mockCreateFromDevfile;

    store = new FakeStoreBuilder()
      .withInfrastructureNamespace([
        { name: 'user-che', attributes: { default: 'true', phase: 'Active' } },
      ])
      .withWorkspacesSettings({
        cheWorkspacePluginRegistryUrl: pluginRegistryUrl,
      })
      .withDwPlugins({
        defaultEditorName: defaultEditorId,
      })
      .withDwServerConfig({
        defaults: {
          editor: defaultEditorId,
          plugins: [{ editor: defaultEditorId, plugins: defaultEditorPlugins }],
          components: [],
          pvcStrategy: undefined,
        },
        cheNamespace: 'user-che',
        containerBuild: {},
        pluginRegistry: {
          openVSXURL: 'open-vsx',
        },
        timeouts: {
          inactivityTimeout: 0,
          runTimeout: 0,
          startTimeout: 0,
        },
      } as api.IServerConfig)
      .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
  });

  afterEach(() => {
    container.restore();
    jest.resetAllMocks();
  });

  describe('createWorkspaceFromDevfile', () => {
    it('should create REQUEST_DEVWORKSPACE and ADD_DEVWORKSPACE when creating a new workspace from devfile', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();
      const devfile: devfileApi.Devfile = {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'test',
          namespace: 'user-che',
        },
      };

      mockCreateFromDevfile.mockResolvedValueOnce(devWorkspace);

      await store.dispatch(
        testStore.actionCreators.createWorkspaceFromDevfile(devfile, {}, undefined, undefined, {}),
      );

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction | pluginRegistryStore.KnownAction> = [
        {
          type: 'REQUEST_DEVWORKSPACE',
          check: AUTHORIZED,
        },
        {
          type: 'ADD_DEVWORKSPACE',
          workspace: devWorkspace,
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_DEVWORKSPACE and RECEIVE_DEVWORKSPACE_ERROR when fails to create a new workspace from devfile', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();
      const devfile: devfileApi.Devfile = {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'test',
          namespace: 'user-che',
        },
      };

      mockCreateFromDevfile.mockRejectedValueOnce(new Error('Something unexpected happened.'));

      try {
        await store.dispatch(
          testStore.actionCreators.createWorkspaceFromDevfile(
            devfile,
            {},
            undefined,
            undefined,
            {},
          ),
        );
      } catch (e) {
        // no-op
      }

      const actions = store.getActions();

      const expectedActions: Array<testStore.KnownAction | pluginRegistryStore.KnownAction> = [
        {
          type: 'REQUEST_DEVWORKSPACE',
          check: AUTHORIZED,
        },
        {
          error: `Something unexpected happened.`,
          type: 'RECEIVE_DEVWORKSPACE_ERROR',
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    describe('specifying editor', () => {
      it('should proceed creating a workspace with a custom editor specified in URL', async () => {
        const devWorkspace = new DevWorkspaceBuilder().build();
        const devfile: devfileApi.Devfile = {
          schemaVersion: '2.1.0',
          metadata: {
            name: 'test',
            namespace: 'user-che',
          },
        };

        mockCreateFromDevfile.mockResolvedValueOnce(devWorkspace);

        const customEditorId = 'custom-editor-id';
        await store.dispatch(
          testStore.actionCreators.createWorkspaceFromDevfile(devfile, {}, undefined, undefined, {
            'che-editor': customEditorId,
          }),
        );

        const expectedEditorDefinition = {
          default: false,
          id: customEditorId,
          plugins: [],
        };
        expect(mockCreateFromDevfile).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          undefined,
          undefined,
          expect.anything(),
          expect.anything(),
          expectedEditorDefinition,
        );
      });

      it('should proceed creating a workspace with a default editor', async () => {
        const devWorkspace = new DevWorkspaceBuilder().build();
        const devfile: devfileApi.Devfile = {
          schemaVersion: '2.1.0',
          metadata: {
            name: 'test',
            namespace: 'user-che',
          },
        };

        mockCreateFromDevfile.mockResolvedValueOnce(devWorkspace);

        await store.dispatch(
          testStore.actionCreators.createWorkspaceFromDevfile(
            devfile,
            {},
            undefined,
            undefined,
            {},
          ),
        );

        const expectedEditorDefinition = {
          default: true,
          id: defaultEditorId,
          plugins: [],
        };
        expect(mockCreateFromDevfile).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          undefined,
          undefined,
          expect.anything(),
          expect.anything(),
          expectedEditorDefinition,
        );
      });
    });
  });
});
