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

import { api } from '@eclipse-che/common';

import { container } from '@/inversify.config';
import * as DwApi from '@/services/backend-client/devWorkspaceApi';
import devfileApi from '@/services/devfileApi';
import { DEVWORKSPACE_CONFIG_ATTR } from '@/services/devfileApi/devWorkspace/spec/template';
import { DevWorkspaceClient } from '@/services/workspace-client/devworkspace/devWorkspaceClient';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

describe('DevWorkspace client, managePvcStrategy', () => {
  const name = 'wksp-test';
  const namespace = 'user-che';
  let client: DevWorkspaceClient;
  let devWorkspaceBuilder: DevWorkspaceBuilder;
  let spyPatchWorkspace: jest.SpyInstance;

  beforeEach(() => {
    client = container.get(DevWorkspaceClient);
    devWorkspaceBuilder = new DevWorkspaceBuilder().withMetadata({ name, namespace });

    spyPatchWorkspace = jest
      .spyOn(DwApi, 'patchWorkspace')
      .mockResolvedValue({ devWorkspace: {} as devfileApi.DevWorkspace, headers: {} });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should update devWorkspace config', async () => {
    const devWorkspace = devWorkspaceBuilder
      .withSpec({
        template: {
          attributes: {
            [DEVWORKSPACE_CONFIG_ATTR]: undefined,
          },
        },
      })
      .build();
    const config = {
      defaults: {},
      cheNamespace: namespace,
    } as api.IServerConfig;

    await client.managePvcStrategy(devWorkspace, config);

    expect(spyPatchWorkspace).toHaveBeenCalledWith(namespace, name, [
      {
        op: 'add',
        path: '/spec/template/attributes/controller.devfile.io~1devworkspace-config',
        value: { name: 'devworkspace-config', namespace: 'user-che' },
      },
    ]);
  });

  it('should add attributes with devWorkspace config', async () => {
    const devWorkspace = devWorkspaceBuilder
      .withSpec({
        template: {},
      })
      .build();
    const config = {
      defaults: {},
      cheNamespace: namespace,
    } as api.IServerConfig;

    await client.managePvcStrategy(devWorkspace, config);

    expect(spyPatchWorkspace).toHaveBeenCalledWith(namespace, name, [
      {
        op: 'add',
        path: '/spec/template/attributes',
        value: {
          [DEVWORKSPACE_CONFIG_ATTR]: { name: 'devworkspace-config', namespace: 'user-che' },
        },
      },
    ]);
  });

  it('should update devWorkspace storage type', async () => {
    const devWorkspace = devWorkspaceBuilder
      .withSpec({
        template: {
          attributes: {
            [DEVWORKSPACE_CONFIG_ATTR]: 'custom-config',
          },
        },
      })
      .build();
    const config = {
      defaults: {
        pvcStrategy: 'custom-pvc-strategy',
      },
      cheNamespace: namespace,
    } as api.IServerConfig;

    await client.managePvcStrategy(devWorkspace, config);

    expect(spyPatchWorkspace).toHaveBeenCalledWith(namespace, name, [
      {
        op: 'add',
        path: '/spec/template/attributes/controller.devfile.io~1storage-type',
        value: 'custom-pvc-strategy',
      },
    ]);
  });

  it('should update devWorkspace template components', async () => {
    const devWorkspace = devWorkspaceBuilder
      .withSpec({
        template: {
          attributes: {
            [DEVWORKSPACE_CONFIG_ATTR]: 'custom-config',
          },
          components: [
            {
              name: 'component1',
              container: {
                env: [
                  {
                    name: 'OPENVSX_REGISTRY_URL',
                    value: 'https://open-vsx.org',
                  },
                ],
                image: 'container1-image',
              },
            },
            {
              name: 'component2',
            },
          ],
        },
      })
      .build();
    const config = {
      defaults: {},
      cheNamespace: namespace,
      pluginRegistry: {
        openVSXURL: 'custom-openvsx-url',
      },
    } as api.IServerConfig;

    await client.managePvcStrategy(devWorkspace, config);

    expect(spyPatchWorkspace).toHaveBeenCalledWith(namespace, name, [
      {
        op: 'replace',
        path: '/spec/template/components',
        value: [
          {
            container: {
              env: [{ name: 'OPENVSX_REGISTRY_URL', value: 'custom-openvsx-url' }],
              image: 'container1-image',
            },
            name: 'component1',
          },
          {
            name: 'component2',
          },
        ],
      },
    ]);
  });

  it('should NOT update devWorkspace config nor devWorkspace storage type', async () => {
    const devWorkspace = devWorkspaceBuilder
      .withSpec({
        template: {
          attributes: {
            [DEVWORKSPACE_CONFIG_ATTR]: 'custom-config',
          },
        },
      })
      .build();
    const config = {
      defaults: {},
      cheNamespace: namespace,
    } as api.IServerConfig;

    await client.managePvcStrategy(devWorkspace, config);

    expect(spyPatchWorkspace).not.toHaveBeenCalled();
  });
});
