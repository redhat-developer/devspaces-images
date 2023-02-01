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

import { container } from '../../../../inversify.config';
import { DevWorkspaceClient } from '../devWorkspaceClient';
import mockAxios from 'axios';
import { prefix } from '../../../dashboard-backend-client/const';
import getDevWorkspaceTemplate from './__mocks__/devWorkspaceSpecTemplates';
import devfileApi from '../../../devfileApi';
import * as DwtApi from '../../../dashboard-backend-client/devWorkspaceTemplateApi';

describe('DevWorkspace client editor update', () => {
  const namespace = 'admin-che';
  const client = container.get(DevWorkspaceClient);
  const pluginRegistryUrl = 'plugin-registry-url';
  const pluginRegistryInternalUrl = 'plugin-registry-internal-url';

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('has target plugin in store', () => {
    it('should return patch for an editor if it has been updated', async () => {
      const template = getDevWorkspaceTemplate('1000m');
      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce({ data: [template] });

      // if cpuLimit changed from '1000m' to '2000m'
      const newTemplate = getDevWorkspaceTemplate('2000m');

      const url = newTemplate?.metadata?.annotations?.[
        'che.eclipse.org/plugin-registry-url'
      ] as string;

      const patch = await client.checkForTemplatesUpdate(
        namespace,
        {
          [url]: newTemplate.spec as devfileApi.Devfile,
        },
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockPatch.mock.calls).toEqual([
        [`${prefix}/namespace/${namespace}/devworkspacetemplates`],
      ]);

      expect(patch).toEqual({
        [newTemplate?.metadata?.name]: [
          {
            op: 'replace',
            path: '/spec',
            value: newTemplate.spec,
          },
        ],
      });
    });

    it(`should return an empty object if it hasn't been updated`, async () => {
      const template = getDevWorkspaceTemplate();
      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce({ data: [template] });

      // if nothing changed
      const newTemplate = getDevWorkspaceTemplate();

      const url = newTemplate?.metadata?.annotations?.[
        'che.eclipse.org/plugin-registry-url'
      ] as string;

      const patch = await client.checkForTemplatesUpdate(
        namespace,
        {
          [url]: newTemplate.spec as devfileApi.Devfile,
        },
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockPatch.mock.calls).toEqual([
        [`${prefix}/namespace/${namespace}/devworkspacetemplates`],
      ]);

      expect(patch).toEqual({});
    });
  });

  describe('don`t have target plugin in store', () => {
    it('should return patch for an editor if it has been updated', async () => {
      const template = getDevWorkspaceTemplate('1000m');
      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce({ data: [template] });

      // if cpuLimit changed from '1000m' to '2000m'
      const newTemplate = getDevWorkspaceTemplate('2000m');
      mockPatch.mockResolvedValueOnce({ data: JSON.stringify(newTemplate.spec) });

      const url = newTemplate?.metadata?.annotations?.[
        'che.eclipse.org/plugin-registry-url'
      ] as string;

      const patch = await client.checkForTemplatesUpdate(
        namespace,
        {},
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockPatch.mock.calls).toEqual([
        [`${prefix}/namespace/${namespace}/devworkspacetemplates`],
        [url],
      ]);

      expect(patch).toEqual({
        [newTemplate?.metadata?.name]: [
          {
            op: 'replace',
            path: '/spec',
            value: newTemplate.spec,
          },
        ],
      });
    });

    it(`should return an empty object if it hasn't been updated`, async () => {
      const template = getDevWorkspaceTemplate();
      const mockPatch = mockAxios.get as jest.Mock;
      mockPatch.mockResolvedValueOnce({ data: [template] });

      // if nothing changed
      const newTemplate = getDevWorkspaceTemplate();
      mockPatch.mockResolvedValueOnce({ data: JSON.stringify(newTemplate.spec) });

      const url = newTemplate?.metadata?.annotations?.[
        'che.eclipse.org/plugin-registry-url'
      ] as string;

      const patch = await client.checkForTemplatesUpdate(
        namespace,
        {},
        pluginRegistryUrl,
        pluginRegistryInternalUrl,
        undefined,
      );

      expect(mockPatch.mock.calls).toEqual([
        [`${prefix}/namespace/${namespace}/devworkspacetemplates`],
        [url],
      ]);

      expect(patch).toEqual({});
    });
  });

  it('should patch target template', async () => {
    const template = getDevWorkspaceTemplate();

    const spyPatchWorkspace = jest.spyOn(DwtApi, 'patchTemplate').mockResolvedValue(template);

    await client.updateTemplates(namespace, {
      [template?.metadata?.name]: [
        {
          op: 'replace',
          path: '/spec',
          value: template.spec,
        },
      ],
    });

    expect(spyPatchWorkspace).toBeCalledWith(namespace, template?.metadata?.name, [
      {
        op: 'replace',
        path: '/spec',
        value: template.spec,
      },
    ]);
  });
});
