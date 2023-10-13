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

import {
  devworkspacetemplateGroup,
  devworkspacetemplateLatestVersion,
  devworkspacetemplatePlural,
  V1alpha2DevWorkspaceTemplate,
} from '@devfile/api';
import { api } from '@eclipse-che/common';
import * as mockClient from '@kubernetes/client-node';
import { CustomObjectsApi } from '@kubernetes/client-node';

import {
  DevWorkspaceTemplateApiService,
  DevWorkspaceTemplateList,
} from '@/devworkspaceClient/services/devWorkspaceTemplateApi';

const namespace = 'user-che';
const name = 'tmpl-name';

describe('DevWorkspaceTemplate API Service', () => {
  let templateService: DevWorkspaceTemplateApiService;

  const stubCustomObjectsApi = {
    createNamespacedCustomObject: () => {
      return Promise.resolve({ body: getDevWorkspaceTemplate() });
    },
    deleteNamespacedCustomObject: () => {
      return Promise.resolve({ body: {} });
    },
    getNamespacedCustomObject: () => {
      return Promise.resolve({ body: getDevWorkspaceTemplate() });
    },
    listNamespacedCustomObject: () => {
      return Promise.resolve({ body: buildListNamespacesCustomObject() });
    },
    patchNamespacedCustomObject: () => {
      return Promise.resolve({ body: getDevWorkspaceTemplate() });
    },
  } as unknown as CustomObjectsApi;

  const spyCreateNamespacedCustomObject = jest.spyOn(
    stubCustomObjectsApi,
    'createNamespacedCustomObject',
  );
  const spyDeleteNamespacedCustomObject = jest.spyOn(
    stubCustomObjectsApi,
    'deleteNamespacedCustomObject',
  );
  const spyGetNamespacedCustomObject = jest.spyOn(
    stubCustomObjectsApi,
    'getNamespacedCustomObject',
  );
  const spyListNamespacedCustomObject = jest.spyOn(
    stubCustomObjectsApi,
    'listNamespacedCustomObject',
  );
  const spyPatchNamespacedCustomObject = jest.spyOn(
    stubCustomObjectsApi,
    'patchNamespacedCustomObject',
  );

  beforeEach(() => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();

    kubeConfig.makeApiClient = jest.fn().mockImplementation(_api => stubCustomObjectsApi);

    templateService = new DevWorkspaceTemplateApiService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getting devWorkspaceTemplates', async () => {
    const res = await templateService.listInNamespace(namespace);
    expect(res).toEqual(buildDevWorkspaceTemplatesList());
    expect(spyListNamespacedCustomObject).toHaveBeenCalledWith(
      devworkspacetemplateGroup,
      devworkspacetemplateLatestVersion,
      namespace,
      devworkspacetemplatePlural,
    );
  });

  test('getting by name', async () => {
    const res = await templateService.getByName(namespace, name);
    expect(res).toEqual(getDevWorkspaceTemplate());
    expect(spyGetNamespacedCustomObject).toHaveBeenCalledWith(
      devworkspacetemplateGroup,
      devworkspacetemplateLatestVersion,
      namespace,
      devworkspacetemplatePlural,
      name,
    );
  });

  test('creating', async () => {
    const devWorkspaceTemplate = {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'DevWorkspaceTemplate',
      metadata: {
        namespace,
      },
    } as V1alpha2DevWorkspaceTemplate;

    const res = await templateService.create(devWorkspaceTemplate);
    expect(res).toEqual(getDevWorkspaceTemplate());
    expect(spyCreateNamespacedCustomObject).toHaveBeenCalledWith(
      devworkspacetemplateGroup,
      devworkspacetemplateLatestVersion,
      namespace,
      devworkspacetemplatePlural,
      devWorkspaceTemplate,
    );
  });

  test('patching', async () => {
    const patches: api.IPatch[] = [
      {
        op: 'replace',
        path: '/metadata/annotations',
        value: {},
      },
    ];

    const res = await templateService.patch(namespace, name, patches);
    expect(res).toEqual(getDevWorkspaceTemplate());
    expect(spyPatchNamespacedCustomObject).toHaveBeenCalledWith(
      devworkspacetemplateGroup,
      devworkspacetemplateLatestVersion,
      namespace,
      devworkspacetemplatePlural,
      name,
      patches,
      undefined,
      undefined,
      undefined,
      expect.anything(),
    );
  });

  test('deleting', async () => {
    await templateService.delete(namespace, name);
    expect(spyDeleteNamespacedCustomObject).toHaveBeenCalledWith(
      devworkspacetemplateGroup,
      devworkspacetemplateLatestVersion,
      namespace,
      devworkspacetemplatePlural,
      name,
    );
  });
});

function buildListNamespacesCustomObject(): DevWorkspaceTemplateList {
  return {
    apiVersion: 'workspace.devfile.io/v1alpha2',
    items: buildDevWorkspaceTemplatesList(),
    kind: 'DevWorkspaceTemplateList',
  };
}
function buildDevWorkspaceTemplatesList() {
  return [getDevWorkspaceTemplate(), getDevWorkspaceTemplate()];
}
function getDevWorkspaceTemplate() {
  return {
    apiVersion: 'workspace.devfile.io/v1alpha2',
    kind: 'DevWorkspaceTemplate',
  };
}
