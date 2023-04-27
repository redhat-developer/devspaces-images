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
import * as DwtApi from '../../../dashboard-backend-client/devWorkspaceTemplateApi';
import * as DwApi from '../../../dashboard-backend-client/devWorkspaceApi';
import devfileApi from '../../../devfileApi';

describe('DevWorkspace client, create', () => {
  let client: DevWorkspaceClient;

  const namespace = 'che';
  const name = 'wksp-test';
  const timestampNew = '2021-10-01T00:00:01.000Z';
  const dateConstructor = window.Date;

  beforeEach(() => {
    client = container.get(DevWorkspaceClient);

    class MockDate extends Date {
      constructor() {
        super(timestampNew);
      }
    }
    window.Date = MockDate as DateConstructor;
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.Date = dateConstructor;
  });

  describe('Create from resources', () => {
    let testDevWorkspace: devfileApi.DevWorkspace;
    let testDevWorkspaceTemplate: devfileApi.DevWorkspaceTemplate;
    let spyCreateWorkspaceTemplate: jest.SpyInstance;
    let spyCreateWorkspace: jest.SpyInstance;

    beforeEach(() => {
      testDevWorkspace = {
        apiVersion: 'workspace.devfile.io/v1alpha2',
        kind: 'DevWorkspace',
        metadata: {
          namespace,
          name,
          uid: '1234567890',
          labels: {},
        },
        spec: {
          started: false,
          template: {
            components: [
              {
                name: 'test-component-name',
                container: {
                  image: 'test.image',
                },
              },
            ],
          },
        },
      } as devfileApi.DevWorkspace;
      testDevWorkspaceTemplate = {
        apiVersion: 'workspace.devfile.io/v1alpha2',
        kind: 'DevWorkspaceTemplate',
        metadata: {
          namespace,
          name,
          annotations: {},
        },
        spec: {
          components: [
            {
              name: 'test-component-name',
              container: {
                image: 'test.image',
              },
              attributes: {},
            },
          ],
        },
      } as devfileApi.DevWorkspaceTemplate;
      spyCreateWorkspaceTemplate = jest
        .spyOn(DwtApi, 'createTemplate')
        .mockResolvedValueOnce(testDevWorkspaceTemplate);
    });

    it('should add pluginRegistry and dashboard URLs as environment variables', async () => {
      const pluginRegistryUrl = 'http://plugin.registry.url';
      const internalPluginRegistryUrl = 'http://internal.plugin.registry.url';
      const openVSXUrl = 'http://openvsx.url';

      await client.createDevWorkspaceTemplate(
        namespace,
        testDevWorkspace,
        testDevWorkspaceTemplate,
        pluginRegistryUrl,
        internalPluginRegistryUrl,
        openVSXUrl,
      );

      expect(spyCreateWorkspaceTemplate).toBeCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            components: expect.arrayContaining([
              expect.objectContaining({
                container: expect.objectContaining({
                  env: expect.arrayContaining([
                    {
                      name: 'CHE_PLUGIN_REGISTRY_URL',
                      value: 'http://plugin.registry.url',
                    },
                    {
                      name: 'CHE_PLUGIN_REGISTRY_INTERNAL_URL',
                      value: 'http://internal.plugin.registry.url',
                    },
                    {
                      name: 'OPENVSX_REGISTRY_URL',
                      value: openVSXUrl,
                    },
                  ]),
                }),
              }),
            ]),
          }),
        }),
      );
    });

    it('should add cluster console url and title as environment variables', async () => {
      const clusterConsoleUrl = 'https://console-openshift-console.url';
      const clusterConsoleTitle = 'OpenShift console';
      const clusterConsole = {
        url: clusterConsoleUrl,
        title: clusterConsoleTitle,
      };

      await client.createDevWorkspaceTemplate(
        namespace,
        testDevWorkspace,
        testDevWorkspaceTemplate,
        undefined,
        undefined,
        undefined,
        clusterConsole,
      );

      expect(spyCreateWorkspaceTemplate).toBeCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            components: expect.arrayContaining([
              expect.objectContaining({
                container: expect.objectContaining({
                  env: expect.arrayContaining([
                    {
                      name: 'CLUSTER_CONSOLE_URL',
                      value: clusterConsoleUrl,
                    },
                    {
                      name: 'CLUSTER_CONSOLE_TITLE',
                      value: clusterConsoleTitle,
                    },
                  ]),
                }),
              }),
            ]),
          }),
        }),
      );
    });

    it('should add owner reference to devWorkspace template to allow automatic cleanup', async () => {
      const pluginRegistryUrl = 'http://plugin.registry.url';
      const internalPluginRegistryUrl = 'http://internal.plugin.registry.url';
      const openVSXUrl = 'http://openvsx.url';

      await client.createDevWorkspaceTemplate(
        namespace,
        testDevWorkspace,
        testDevWorkspaceTemplate,
        pluginRegistryUrl,
        internalPluginRegistryUrl,
        openVSXUrl,
      );

      expect(spyCreateWorkspaceTemplate).toBeCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            ownerReferences: expect.arrayContaining([
              expect.objectContaining({
                name: testDevWorkspace.metadata.name,
                uid: testDevWorkspace.metadata.uid,
              }),
            ]),
          }),
        }),
      );
    });

    it('should add routingClass if it does not exist', async () => {
      const routingClass = 'che';
      const responce = {
        headers: {},
        devWorkspace: testDevWorkspace,
      };
      spyCreateWorkspace = jest.spyOn(DwApi, 'createWorkspace').mockResolvedValueOnce(responce);

      await client.createDevWorkspace(namespace, testDevWorkspace, undefined);

      expect(spyCreateWorkspace).toBeCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            routingClass: routingClass,
          }),
        }),
      );
    });
  });
});
