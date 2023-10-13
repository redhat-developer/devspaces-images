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

import mockAxios from 'axios';

import { container } from '@/inversify.config';
import devfileApi from '@/services/devfileApi';
import {
  DEVWORKSPACE_DEBUG_START_ANNOTATION,
  DevWorkspaceClient,
} from '@/services/workspace-client/devworkspace/devWorkspaceClient';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

describe('DevWorkspaceClient debug mode', () => {
  const devWorkspaceClient = container.get(DevWorkspaceClient);
  const name = 'dev-wksp-tst';
  const namespace = 'admin-che';

  let devWorkspaceNoDebug: devfileApi.DevWorkspace;
  let devWorkspaceWithDebug: devfileApi.DevWorkspace;

  beforeEach(() => {
    devWorkspaceNoDebug = new DevWorkspaceBuilder().withMetadata({ name, namespace }).build();
    devWorkspaceWithDebug = new DevWorkspaceBuilder()
      .withMetadata({
        annotations: {
          [DEVWORKSPACE_DEBUG_START_ANNOTATION]: 'true',
        },
        name,
        namespace,
      })
      .build();
  });

  describe('getting debug mode', () => {
    it('should return false', () => {
      expect(devWorkspaceClient.getDebugMode(devWorkspaceNoDebug)).toEqual(false);
    });

    it('should return true', () => {
      expect(devWorkspaceClient.getDebugMode(devWorkspaceWithDebug)).toEqual(true);
    });
  });

  describe('updating debug mode', () => {
    beforeEach(() => {
      mockAxios.patch = jest.fn();
    });

    it('if debug mode doesn`t change, the patch request shouldn`t be called', async () => {
      const mockPatch = mockAxios.patch as jest.Mock;
      mockPatch.mockResolvedValue(new Promise(resolve => resolve({ data: undefined })));

      let resultData = await devWorkspaceClient.manageDebugMode(devWorkspaceNoDebug, false);
      expect(resultData).toEqual(devWorkspaceNoDebug);

      resultData = await devWorkspaceClient.manageDebugMode(devWorkspaceWithDebug, true);
      expect(resultData).toEqual(devWorkspaceWithDebug);

      expect(mockPatch.mock.calls.length).toEqual(0);
    });

    it('if debug mode has changed to true, the patch "add" request should be called', async () => {
      const mockPatch = mockAxios.patch as jest.Mock;
      mockPatch.mockResolvedValue(new Promise(resolve => resolve({ data: devWorkspaceWithDebug })));

      expect(devWorkspaceClient.getDebugMode(devWorkspaceNoDebug)).toEqual(false);

      const resultData: devfileApi.DevWorkspace = await devWorkspaceClient.manageDebugMode(
        devWorkspaceNoDebug,
        true,
      );
      expect(mockPatch.mock.calls[mockPatch.mock.calls.length - 1]).toEqual([
        `/dashboard/api/namespace/${namespace}/devworkspaces/${name}`,
        [
          {
            op: 'add',
            path: '/metadata/annotations/controller.devfile.io~1debug-start',
            value: 'true',
          },
        ],
      ]);
      expect(resultData).toEqual(devWorkspaceWithDebug);
    });

    it('if debug mode has changed to true, the patch "replace" request should be called', async () => {
      const mockPatch = mockAxios.patch as jest.Mock;
      mockPatch.mockResolvedValue(new Promise(resolve => resolve({ data: devWorkspaceWithDebug })));

      const devWorkspaceNoDebug = new DevWorkspaceBuilder()
        .withMetadata({
          annotations: {
            [DEVWORKSPACE_DEBUG_START_ANNOTATION]: 'false',
          },
          name,
          namespace,
        })
        .build();

      expect(devWorkspaceClient.getDebugMode(devWorkspaceNoDebug)).toEqual(false);

      const resultData: devfileApi.DevWorkspace = await devWorkspaceClient.manageDebugMode(
        devWorkspaceNoDebug,
        true,
      );
      expect(mockPatch.mock.calls[mockPatch.mock.calls.length - 1]).toEqual([
        `/dashboard/api/namespace/${namespace}/devworkspaces/${name}`,
        [
          {
            op: 'replace',
            path: '/metadata/annotations/controller.devfile.io~1debug-start',
            value: 'true',
          },
        ],
      ]);
      expect(resultData).toEqual(devWorkspaceWithDebug);
    });

    it('if debug mode has changed to false, the patch "remove" request should be called', async () => {
      const mockPatch = mockAxios.patch as jest.Mock;
      mockPatch.mockResolvedValue(new Promise(resolve => resolve({ data: devWorkspaceNoDebug })));

      expect(devWorkspaceClient.getDebugMode(devWorkspaceWithDebug)).toEqual(true);

      const resultData: devfileApi.DevWorkspace = await devWorkspaceClient.manageDebugMode(
        devWorkspaceWithDebug,
        false,
      );
      expect(mockPatch.mock.calls[mockPatch.mock.calls.length - 1]).toEqual([
        `/dashboard/api/namespace/${namespace}/devworkspaces/${name}`,
        [
          {
            op: 'remove',
            path: '/metadata/annotations/controller.devfile.io~1debug-start',
          },
        ],
      ]);
      expect(resultData).toEqual(devWorkspaceNoDebug);
    });
  });
});
