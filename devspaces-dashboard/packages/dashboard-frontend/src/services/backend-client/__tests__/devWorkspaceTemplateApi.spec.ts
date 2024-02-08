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

import { api } from '@eclipse-che/common';
import mockAxios from 'axios';

import {
  createTemplate,
  getTemplateByName,
  getTemplates,
  patchTemplate,
} from '@/services/backend-client/devWorkspaceTemplateApi';
import devfileApi from '@/services/devfileApi';

describe('DevWorkspaceTemplate API', () => {
  const mockGet = mockAxios.get as jest.Mock;
  const mockPost = mockAxios.post as jest.Mock;
  const mockPatch = mockAxios.patch as jest.Mock;

  const namespace = 'test-name';
  const devWorkspaceTemplateName = 'che-code';
  const devWorkspaceTemplate: devfileApi.DevWorkspaceTemplate = {
    apiVersion: 'workspace.devfile.io/v1alpha2',
    kind: 'DevWorkspaceTemplate',
    metadata: {
      name: devWorkspaceTemplateName,
      namespace,
      annotations: {},
    },
    spec: {},
  };
  const devWorkspaceTemplatePatch: api.IPatch[] = [
    {
      op: 'replace',
      path: '/spec',
      value: devWorkspaceTemplate.spec,
    },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetch DevWorkspaceTemplates', () => {
    it('should call "/dashboard/api/namespace/test-name/devworkspacetemplates"', async () => {
      mockGet.mockResolvedValueOnce(new Promise(resolve => resolve({ data: {} })));
      await getTemplates(namespace);

      expect(mockGet).toHaveBeenCalledWith(
        '/dashboard/api/namespace/test-name/devworkspacetemplates',
        undefined,
      );
    });

    it('should return a list of devWorkspaceTemplates', async () => {
      mockGet.mockResolvedValueOnce(
        new Promise(resolve => resolve({ data: [devWorkspaceTemplate] })),
      );

      const res = await getTemplates(namespace);

      expect(res).toEqual([devWorkspaceTemplate]);
    });
  });

  describe('fetch a DevWorkspaceTemplate by name', () => {
    it('should call "/dashboard/api/namespace/test-name/devworkspacetemplates/che-code"', async () => {
      mockGet.mockResolvedValueOnce(new Promise(resolve => resolve({ data: {} })));
      await getTemplateByName(namespace, devWorkspaceTemplateName);

      expect(mockGet).toHaveBeenCalledWith(
        '/dashboard/api/namespace/test-name/devworkspacetemplates/che-code',
        undefined,
      );
    });

    it('should return a devWorkspaceTemplate', async () => {
      mockGet.mockResolvedValueOnce(
        new Promise(resolve => resolve({ data: devWorkspaceTemplate })),
      );

      const res = await getTemplateByName(namespace, devWorkspaceTemplateName);

      expect(res).toEqual(devWorkspaceTemplate);
    });
  });

  describe('create a DevWorkspaceTemplate', () => {
    it('should call "/dashboard/api/namespace/test-name/devworkspacetemplates"', async () => {
      mockPost.mockResolvedValueOnce(new Promise(resolve => resolve({ data: {} })));
      await createTemplate(devWorkspaceTemplate);

      expect(mockPost).toHaveBeenCalledWith(
        '/dashboard/api/namespace/test-name/devworkspacetemplates',
        { template: devWorkspaceTemplate },
        undefined,
      );
    });

    it('should return a devWorkspaceTemplate', async () => {
      mockPost.mockResolvedValueOnce(
        new Promise(resolve => resolve({ data: devWorkspaceTemplate })),
      );

      const res = await createTemplate(devWorkspaceTemplate);

      expect(res).toEqual(devWorkspaceTemplate);
    });
  });

  describe('patch a DevWorkspaceTemplate', () => {
    it('should call "/dashboard/api/namespace/test-name/devworkspacetemplates/che-code"', async () => {
      mockPatch.mockResolvedValueOnce(new Promise(resolve => resolve({ data: {} })));
      await patchTemplate(namespace, devWorkspaceTemplateName, devWorkspaceTemplatePatch);

      expect(mockPatch).toHaveBeenCalledWith(
        '/dashboard/api/namespace/test-name/devworkspacetemplates/che-code',
        [{ op: 'replace', path: '/spec', value: {} }],
        undefined,
      );
    });

    it('should return a devWorkspaceTemplate', async () => {
      mockPatch.mockResolvedValueOnce(
        new Promise(resolve => resolve({ data: devWorkspaceTemplate })),
      );

      const res = await patchTemplate(
        namespace,
        devWorkspaceTemplateName,
        devWorkspaceTemplatePatch,
      );

      expect(res).toEqual(devWorkspaceTemplate);
    });
  });
});
