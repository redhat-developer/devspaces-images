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
  devworkspaceGroup,
  devworkspaceLatestVersion,
  devworkspacePlural,
  V1alpha2DevWorkspace,
} from '@devfile/api';
import { api } from '@eclipse-che/common';
import { IPatch } from '@eclipse-che/common/src/dto/api';
import * as mockClient from '@kubernetes/client-node';
import { CustomObjectsApi } from '@kubernetes/client-node';
import { IncomingMessage } from 'http';
import { DevWorkspaceApiService } from '../devWorkspaceApi';

const namespace = 'user-che';
const name = 'wksp-name';

describe('DevWorkspace API Service', () => {
  let devWorkspaceService: DevWorkspaceApiService;

  const stubCustomObjectsApi = {
    createNamespacedCustomObject: () => {
      return Promise.resolve({
        body: getDevWorkspace(),
        response: { headers: {} } as IncomingMessage,
      });
    },
    deleteNamespacedCustomObject: () => {
      return Promise.resolve({ body: {} });
    },
    getNamespacedCustomObject: () => {
      return Promise.resolve({ body: getDevWorkspace() });
    },
    listNamespacedCustomObject: () => {
      return Promise.resolve({ body: buildListNamespacesCustomObject() });
    },
    patchNamespacedCustomObject: () => {
      return Promise.resolve({
        body: getDevWorkspace(),
        response: { headers: {} } as IncomingMessage,
      });
    },
    replaceNamespacedCustomObject: () => {
      return Promise.resolve({ body: getDevWorkspace() });
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

    devWorkspaceService = new DevWorkspaceApiService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getting devWorkspaces list', async () => {
    const res = await devWorkspaceService.listInNamespace(namespace);
    expect(res).toEqual(buildListNamespacesCustomObject());
    expect(spyListNamespacedCustomObject).toHaveBeenCalledWith(
      devworkspaceGroup,
      devworkspaceLatestVersion,
      namespace,
      devworkspacePlural,
    );
  });

  test('getting by name', async () => {
    const res = await devWorkspaceService.getByName(namespace, name);
    expect(res).toEqual(getDevWorkspace());
    expect(spyGetNamespacedCustomObject).toHaveBeenCalledWith(
      devworkspaceGroup,
      devworkspaceLatestVersion,
      namespace,
      devworkspacePlural,
      name,
    );
  });

  test('creating', async () => {
    const devWorkspace = {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'DevWorkspace',
      metadata: {
        name: 'wksp-name',
        namespace,
      },
    } as V1alpha2DevWorkspace;

    const res = await devWorkspaceService.create(devWorkspace, namespace);
    expect(res.devWorkspace).toStrictEqual(getDevWorkspace());
    expect(res.headers).toStrictEqual({});
    expect(spyCreateNamespacedCustomObject).toHaveBeenCalledWith(
      devworkspaceGroup,
      devworkspaceLatestVersion,
      namespace,
      devworkspacePlural,
      devWorkspace,
    );
  });

  test('patching', async () => {
    const patches: IPatch[] = [
      {
        op: 'replace',
        path: '/metadata/annotations',
        value: {},
      },
    ];

    const res = await devWorkspaceService.patch(namespace, name, patches);
    expect(res.devWorkspace).toStrictEqual(getDevWorkspace());
    expect(res.headers).toStrictEqual({});
    expect(spyPatchNamespacedCustomObject).toHaveBeenCalledWith(
      devworkspaceGroup,
      devworkspaceLatestVersion,
      namespace,
      devworkspacePlural,
      name,
      patches,
      undefined,
      undefined,
      undefined,
      expect.anything(),
    );
  });

  test('deleting', async () => {
    await devWorkspaceService.delete(namespace, name);
    expect(spyDeleteNamespacedCustomObject).toHaveBeenCalledWith(
      devworkspaceGroup,
      devworkspaceLatestVersion,
      namespace,
      devworkspacePlural,
      name,
    );
  });
});

function buildListNamespacesCustomObject(): api.IDevWorkspaceList {
  return {
    apiVersion: 'workspace.devfile.io/v1alpha2',
    items: buildDevWorkspacesList(),
    kind: 'DevWorkspaceList',
    metadata: {
      resourceVersion: '12345',
    },
  };
}
function buildDevWorkspacesList() {
  return [getDevWorkspace(), getDevWorkspace()];
}
function getDevWorkspace() {
  return {
    apiVersion: 'workspace.devfile.io/v1alpha2',
    kind: 'DevWorkspace',
  };
}
