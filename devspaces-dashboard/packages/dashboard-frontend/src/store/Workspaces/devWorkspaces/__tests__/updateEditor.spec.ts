/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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

import { api, ApplicationId } from '@eclipse-che/common';
import { AnyAction } from 'redux';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import { container } from '@/inversify.config';
import devfileApi from '@/services/devfileApi';
import { DevWorkspaceClient } from '@/services/workspace-client/devworkspace/devWorkspaceClient';
import { AppState } from '@/store';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import {
  getEditorName,
  getLifeTimeMs,
  updateEditor,
} from '@/store/Workspaces/devWorkspaces/updateEditor';

const mockPatchTemplate = jest.fn();
jest.mock('@/services/backend-client/devWorkspaceTemplateApi', () => ({
  patchTemplate: (namespace: string, templateName: string, patch: api.IPatch[]) =>
    mockPatchTemplate(namespace, templateName, patch),
}));

describe('updateEditor, functions', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('getEditorName', () => {
    it('should return undefined if the target devworkspace dos not have an editor', async () => {
      const devWorkspace = new DevWorkspaceBuilder()
        .withContributions([
          {
            name: 'default',
            uri: 'https://test.com/devfile.yaml',
            attributes: { 'che.eclipse.org/default-plugin': true },
          },
        ])
        .build();

      const name = getEditorName(devWorkspace);

      expect(name).toBeUndefined();
    });

    it('should return the editor name', async () => {
      const devWorkspace = new DevWorkspaceBuilder()
        .withContributions([
          {
            name: 'default',
            uri: 'https://test.com/devfile.yaml',
            attributes: { 'che.eclipse.org/default-plugin': true },
          },
          {
            name: 'editor',
            kubernetes: {
              name: 'che-code',
            },
          },
        ])
        .build();

      const editorName = getEditorName(devWorkspace);

      expect(editorName).toBe('che-code');
    });
  });

  describe('getLifeTimeMs', () => {
    it('should return 0 without creationTimestamp', async () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      const result = getLifeTimeMs(devWorkspace);

      expect(result).toBe(0);
    });

    it('should return the devWorkspace lifetime', async () => {
      const lifeTime = 1234;
      const devWorkspace = new DevWorkspaceBuilder()
        .withMetadata({
          creationTimestamp: new Date(Date.now() - lifeTime * 1000),
        })
        .build();

      const result = Math.floor(getLifeTimeMs(devWorkspace) / 1000);

      expect(result).toBe(lifeTime);
    });
  });

  describe('updateEditor', () => {
    const mockCheckForEditorUpdate = jest.fn();
    const devWorkspaceClient = container.get(DevWorkspaceClient);
    devWorkspaceClient.checkForTemplatesUpdate = mockCheckForEditorUpdate;

    const namespace = 'user-che';
    const pluginRegistryURL = 'https://dummy.registry';
    const clusterConsole = {
      id: ApplicationId.CLUSTER_CONSOLE,
      url: 'https://console-url',
      icon: 'https://console-icon-url',
      title: 'Cluster console',
    };
    const editorId = 'che-incubator/che-code/latest';
    const editors = [
      {
        schemaVersion: '2.2.0',
        metadata: {
          name: 'che-code',
          attributes: {
            publisher: 'che-incubator',
            version: 'latest',
          },
        },
      } as devfileApi.Devfile,
    ];
    let store: MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
    beforeEach(() => {
      store = new FakeStoreBuilder()
        .withInfrastructureNamespace([
          { name: namespace, attributes: { default: 'true', phase: 'Active' } },
        ])
        .withClusterInfo({ applications: [clusterConsole] })
        .withDwServerConfig({
          pluginRegistry: { openVSXURL: 'https://openvsx.org' },
          pluginRegistryInternalURL: 'https://internal.registry',
          pluginRegistryURL,
        })
        .withDwPlugins({}, {}, false, editors, undefined, editorId)
        .build();
    });

    it('should check for update and do nothing', async () => {
      mockCheckForEditorUpdate.mockResolvedValueOnce([]);

      await updateEditor('che-code', store.getState);

      expect(mockCheckForEditorUpdate).toHaveBeenCalledWith(
        'che-code',
        namespace,
        editors,
        pluginRegistryURL,
        'https://internal.registry',
        'https://openvsx.org',
        clusterConsole,
      );
      expect(mockPatchTemplate).not.toHaveBeenCalled();
    });

    it('should update the target devWorkspaceTemplate', async () => {
      mockCheckForEditorUpdate.mockResolvedValueOnce([
        { op: 'replace', path: '/spec/commands', value: [] },
      ]);

      await updateEditor('che-code', store.getState);

      expect(mockCheckForEditorUpdate).toHaveBeenCalledWith(
        'che-code',
        namespace,
        editors,
        pluginRegistryURL,
        'https://internal.registry',
        'https://openvsx.org',
        clusterConsole,
      );
      expect(mockPatchTemplate).toHaveBeenCalledWith('user-che', 'che-code', [
        {
          op: 'replace',
          path: '/spec/commands',
          value: [],
        },
      ]);
    });
  });
});
