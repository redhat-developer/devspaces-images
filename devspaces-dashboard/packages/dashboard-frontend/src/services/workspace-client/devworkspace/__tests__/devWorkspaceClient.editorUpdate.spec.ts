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
import getDevWorkspaceTemplate from '@/services/workspace-client/devworkspace/__tests__/__mocks__/devWorkspaceSpecTemplates';
import { DevWorkspaceClient } from '@/services/workspace-client/devworkspace/devWorkspaceClient';

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

  describe('has target plugin in store', () => {
    it('should return patch for an editor if it has been updated', async () => {
      const template = getDevWorkspaceTemplate('1000m');
      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce(new Promise(resolve => resolve({ data: template })));

      // if cpuLimit changed from '1000m' to '2000m'
      const newTemplate = getDevWorkspaceTemplate('2000m');

      const url = newTemplate.metadata.annotations?.['che.eclipse.org/plugin-registry-url'];

      const editorName = newTemplate.metadata.name;

      const patch = await client.checkForTemplatesUpdate(
        editorName,
        namespace,
        {
          [url]: newTemplate.spec as devfileApi.Devfile,
        },
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
      const template = getDevWorkspaceTemplate('1000m');
      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce(new Promise(resolve => resolve({ data: template })));

      // if nothing changed
      const newTemplate = getDevWorkspaceTemplate('1000m');

      const url = newTemplate.metadata.annotations?.['che.eclipse.org/plugin-registry-url'];

      const editorName = newTemplate.metadata.name;

      const patch = await client.checkForTemplatesUpdate(
        editorName,
        namespace,
        {
          [url]: newTemplate.spec as devfileApi.Devfile,
        },
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

  describe('don`t have target plugin in store', () => {
    it('should return patch for an editor if it has been updated', async () => {
      const template = getDevWorkspaceTemplate('1000m');
      const mockGet = mockAxios.get as jest.Mock;
      mockGet.mockResolvedValueOnce(new Promise(resolve => resolve({ data: template })));

      // if cpuLimit changed from '1000m' to '2000m'
      const newTemplate = getDevWorkspaceTemplate('2000m');
      const mockPost = mockAxios.post as jest.Mock;
      mockPost.mockResolvedValueOnce(
        new Promise(resolve => resolve({ data: JSON.stringify(newTemplate.spec) })),
      );

      const url = newTemplate.metadata.annotations?.['che.eclipse.org/plugin-registry-url'];

      const editorName = newTemplate.metadata.name;

      const patch = await client.checkForTemplatesUpdate(
        editorName,
        namespace,
        {},
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockGet).toHaveBeenCalledWith(
        `${dashboardBackendPrefix}/namespace/${namespace}/devworkspacetemplates/${editorName}`,
        undefined,
      );
      expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('/data/resolver'), {
        url: url,
      });

      expect(patch).toEqual([
        {
          op: 'replace',
          path: '/spec',
          value: newTemplate.spec,
        },
      ]);
    });

    it(`should return an empty object if it hasn't been updated`, async () => {
      const template = getDevWorkspaceTemplate('1000m');
      const mockGet = mockAxios.get as jest.Mock;
      mockGet.mockResolvedValueOnce(new Promise(resolve => resolve({ data: template })));

      // if nothing changed
      const newTemplate = getDevWorkspaceTemplate('1000m');
      const mockPost = mockAxios.post as jest.Mock;
      mockPost.mockResolvedValueOnce(
        new Promise(resolve => resolve({ data: JSON.stringify(newTemplate.spec) })),
      );
      const url = newTemplate.metadata.annotations?.['che.eclipse.org/plugin-registry-url'];

      const editorName = newTemplate.metadata.name;

      const patch = await client.checkForTemplatesUpdate(
        editorName,
        namespace,
        {},
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockGet).toHaveBeenCalledWith(
        `${dashboardBackendPrefix}/namespace/${namespace}/devworkspacetemplates/${editorName}`,
        undefined,
      );
      expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('/data/resolver'), {
        url: url,
      });

      expect(patch).toEqual([]);
    });
  });

  it('should patch target template', async () => {
    const template = getDevWorkspaceTemplate('1000m');

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
