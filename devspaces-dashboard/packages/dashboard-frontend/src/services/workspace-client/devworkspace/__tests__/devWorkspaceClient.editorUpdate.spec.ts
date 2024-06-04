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

import mockAxios from 'axios';

import { container } from '@/inversify.config';
import { dashboardBackendPrefix } from '@/services/backend-client/const';
import * as DwtApi from '@/services/backend-client/devWorkspaceTemplateApi';
import devfileApi from '@/services/devfileApi';
import getVSCodeDevWorkspaceTemplate from '@/services/workspace-client/devworkspace/__tests__/__mocks__/devWorkspaceSpecTemplates';
import getVSCodeEditorDefinition from '@/services/workspace-client/devworkspace/__tests__/__mocks__/editorDefinitions';
import {
  COMPONENT_UPDATE_POLICY,
  DevWorkspaceClient,
  REGISTRY_URL,
} from '@/services/workspace-client/devworkspace/devWorkspaceClient';

const mockFetchData = jest.fn();
jest.mock('@/services/registry/fetchData', () => ({
  fetchData: (...args: unknown[]) => mockFetchData(...args),
}));

describe('DevWorkspace client editor update', () => {
  const namespace = 'admin-che';
  const client = container.get(DevWorkspaceClient);
  const pluginRegistryUrl = 'plugin-registry-url';
  const pluginRegistryInternalUrl = 'plugin-registry-internal-url';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('has target editor in store', () => {
    it('should return patch for an editor if it has been updated', async () => {
      const template = getVSCodeDevWorkspaceTemplate('1000m');
      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce(new Promise(resolve => resolve({ data: template })));

      // if cpuLimit changed from '1000m' to '500m'
      const newTemplate = getVSCodeDevWorkspaceTemplate('500m');

      const editors: devfileApi.Devfile[] = [getVSCodeEditorDefinition() as devfileApi.Devfile];
      const editorName = newTemplate.metadata.name;

      const patch = await client.checkForTemplatesUpdate(
        editorName,
        namespace,
        editors,
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockPatch.mock.calls).toEqual([
        [`${dashboardBackendPrefix}/namespace/${namespace}/devworkspacetemplates/${editorName}`],
      ]);

      expect(patch).toEqual([
        {
          op: 'replace',
          path: '/spec',
          value: newTemplate.spec,
        },
      ]);
    });

    it(`should return an empty object if it hasn't been updated`, async () => {
      const template = getVSCodeDevWorkspaceTemplate('500m');
      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce(new Promise(resolve => resolve({ data: template })));

      // if nothing changed
      const newTemplate = getVSCodeDevWorkspaceTemplate('500m');
      const editors: devfileApi.Devfile[] = [getVSCodeEditorDefinition() as devfileApi.Devfile];

      const editorName = newTemplate.metadata.name;

      const patch = await client.checkForTemplatesUpdate(
        editorName,
        namespace,
        editors,
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockPatch.mock.calls).toEqual([
        [`${dashboardBackendPrefix}/namespace/${namespace}/devworkspacetemplates/${editorName}`],
      ]);

      expect(patch).toEqual([]);
    });
  });

  describe('has no target editor in store', () => {
    it(`should return an empty patch`, async () => {
      const template = getVSCodeDevWorkspaceTemplate('1000m');
      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce(new Promise(resolve => resolve({ data: template })));

      // if cpuLimit changed from '1000m' to '500m'
      const newTemplate = getVSCodeDevWorkspaceTemplate('500m');

      const editor = getVSCodeEditorDefinition() as devfileApi.Devfile;
      editor.metadata.name = 'non-existing-editor';
      const editors: devfileApi.Devfile[] = [editor];
      const editorName = newTemplate.metadata.name;

      const patch = await client.checkForTemplatesUpdate(
        editorName,
        namespace,
        editors,
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockPatch.mock.calls).toEqual([
        [`${dashboardBackendPrefix}/namespace/${namespace}/devworkspacetemplates/${editorName}`],
      ]);

      expect(patch).toEqual([]);
    });
  });

  describe('DevWorkspaceTemplate with plugin registry URL', () => {
    it('should return patch for an editor if it has been updated', async () => {
      const template = getVSCodeDevWorkspaceTemplate('1000m');
      template.metadata.annotations = {
        'che.eclipse.org/components-update-policy': 'managed',
        'che.eclipse.org/plugin-registry-url':
          'https://192.168.64.24.nip.io/plugin-registry/v3/plugins/che-incubator/che-code/latest/devfile.yaml',
      };

      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce(new Promise(resolve => resolve({ data: template })));

      // if cpuLimit changed from '1000m' to '500m'
      const newTemplate = getVSCodeDevWorkspaceTemplate('500m');
      newTemplate.metadata.annotations = {
        'che.eclipse.org/components-update-policy': 'managed',
        'che.eclipse.org/plugin-registry-url':
          'https://192.168.64.24.nip.io/plugin-registry/v3/plugins/che-incubator/che-code/latest/devfile.yaml',
      };

      const editors: devfileApi.Devfile[] = [getVSCodeEditorDefinition() as devfileApi.Devfile];
      const editorName = newTemplate.metadata.name;

      const patch = await client.checkForTemplatesUpdate(
        editorName,
        namespace,
        editors,
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockPatch.mock.calls).toEqual([
        [`${dashboardBackendPrefix}/namespace/${namespace}/devworkspacetemplates/${editorName}`],
      ]);

      expect(patch).toEqual([
        {
          op: 'replace',
          path: '/metadata/annotations',
          value: {
            [COMPONENT_UPDATE_POLICY]: 'managed',
            [REGISTRY_URL]: 'che-incubator/che-code/latest',
          },
        },
        {
          op: 'replace',
          path: '/spec',
          value: newTemplate.spec,
        },
      ]);
    });

    it('should return an empty patch if registry URL does not match a default plugin registry URL', async () => {
      const template = getVSCodeDevWorkspaceTemplate('1000m');
      template.metadata.annotations = {
        'che.eclipse.org/components-update-policy': 'managed',
        'che.eclipse.org/plugin-registry-url':
          'https://192.168.64.24.nip.io/custom-registry/v3/plugins/che-incubator/che-code/latest/devfile.yaml',
      };

      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce(new Promise(resolve => resolve({ data: template })));

      // if cpuLimit changed from '1000m' to '500m'
      const newTemplate = getVSCodeDevWorkspaceTemplate('500m');
      newTemplate.metadata.annotations = {
        'che.eclipse.org/components-update-policy': 'managed',
        'che.eclipse.org/plugin-registry-url':
          'https://192.168.64.24.nip.io/custom-registry/v3/plugins/che-incubator/che-code/latest/devfile.yaml',
      };

      const editors: devfileApi.Devfile[] = [getVSCodeEditorDefinition() as devfileApi.Devfile];
      const editorName = newTemplate.metadata.name;

      const patch = await client.checkForTemplatesUpdate(
        editorName,
        namespace,
        editors,
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockPatch.mock.calls).toEqual([
        [`${dashboardBackendPrefix}/namespace/${namespace}/devworkspacetemplates/${editorName}`],
      ]);

      expect(patch).toEqual([]);
    });

    it('should update annotations if registry URL matches a default plugin registry URL but no changes in a template', async () => {
      const template = getVSCodeDevWorkspaceTemplate('500m');
      template.metadata.annotations = {
        'che.eclipse.org/components-update-policy': 'managed',
        'che.eclipse.org/plugin-registry-url':
          'https://192.168.64.24.nip.io/plugin-registry/v3/plugins/che-incubator/che-code/latest/devfile.yaml',
      };

      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce(new Promise(resolve => resolve({ data: template })));

      // if cpuLimit changed from '1000m' to '500m'
      const newTemplate = getVSCodeDevWorkspaceTemplate('500m');
      newTemplate.metadata.annotations = {
        'che.eclipse.org/components-update-policy': 'managed',
        'che.eclipse.org/plugin-registry-url':
          'https://192.168.64.24.nip.io/plugin-registry/v3/plugins/che-incubator/che-code/latest/devfile.yaml',
      };

      const editors: devfileApi.Devfile[] = [getVSCodeEditorDefinition() as devfileApi.Devfile];
      const editorName = newTemplate.metadata.name;

      const patch = await client.checkForTemplatesUpdate(
        editorName,
        namespace,
        editors,
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockPatch.mock.calls).toEqual([
        [`${dashboardBackendPrefix}/namespace/${namespace}/devworkspacetemplates/${editorName}`],
      ]);

      expect(patch).toEqual([
        {
          op: 'replace',
          path: '/metadata/annotations',
          value: {
            [COMPONENT_UPDATE_POLICY]: 'managed',
            [REGISTRY_URL]: 'che-incubator/che-code/latest',
          },
        },
      ]);
    });

    it('should update annotations if registry URL matches a default plugin registry but editor id is not in local storage', async () => {
      const template = getVSCodeDevWorkspaceTemplate('500m');
      template.metadata.annotations = {
        'che.eclipse.org/components-update-policy': 'managed',
        'che.eclipse.org/plugin-registry-url':
          'https://192.168.64.24.nip.io/plugin-registry/v3/plugins/che-incubator/custom-editor/latest/devfile.yaml',
      };

      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce(new Promise(resolve => resolve({ data: template })));

      // if cpuLimit changed from '1000m' to '500m'
      const newTemplate = getVSCodeDevWorkspaceTemplate('1000m');
      newTemplate.metadata.annotations = {
        'che.eclipse.org/components-update-policy': 'managed',
        'che.eclipse.org/plugin-registry-url':
          'https://192.168.64.24.nip.io/plugin-registry/v3/plugins/che-incubator/custom-editor/latest/devfile.yaml',
      };

      const editors: devfileApi.Devfile[] = [getVSCodeEditorDefinition() as devfileApi.Devfile];
      const editorName = newTemplate.metadata.name;

      const patch = await client.checkForTemplatesUpdate(
        editorName,
        namespace,
        editors,
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockPatch.mock.calls).toEqual([
        [`${dashboardBackendPrefix}/namespace/${namespace}/devworkspacetemplates/${editorName}`],
      ]);

      expect(patch).toEqual([
        {
          op: 'replace',
          path: '/metadata/annotations',
          value: {
            [COMPONENT_UPDATE_POLICY]: 'managed',
            [REGISTRY_URL]: 'che-incubator/custom-editor/latest',
          },
        },
      ]);
    });
  });

  it('should patch target template', async () => {
    const template = getVSCodeDevWorkspaceTemplate('1000m');

    const editorName = template.metadata.name;

    const spyPatchWorkspace = jest.spyOn(DwtApi, 'patchTemplate').mockResolvedValue(template);

    await DwtApi.patchTemplate(namespace, editorName, [
      {
        op: 'replace',
        path: '/spec',
        value: template.spec,
      },
    ]);
    expect(spyPatchWorkspace).toHaveBeenCalledWith(namespace, editorName, [
      {
        op: 'replace',
        path: '/spec',
        value: template.spec,
      },
    ]);
  });
});
