/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import { DevWorkspaceBuilder } from '../../../../store/__mocks__/devWorkspaceBuilder';
import { DevWorkspaceClient } from '../devWorkspaceClient';
import * as DwApi from '../../../dashboard-backend-client/devWorkspaceApi';
import * as DwtApi from '../../../dashboard-backend-client/devWorkspaceTemplateApi';
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
    jest.resetAllMocks();
    window.Date = dateConstructor;
  });

  describe('Create from devfile', () => {
    let testDevfile: devfileApi.Devfile;
    let spyCreateWorkspace: jest.SpyInstance;
    let spyPatchWorkspace: jest.SpyInstance;

    beforeEach(() => {
      testDevfile = {
        schemaVersion: '2.1.0',
        metadata: {
          namespace,
          name,
        },
      };
      const testWorkspace = new DevWorkspaceBuilder()
        .withMetadata({
          name,
          namespace,
        })
        .build();
      spyCreateWorkspace = jest
        .spyOn(DwApi, 'createWorkspace')
        .mockResolvedValueOnce(testWorkspace);
      spyPatchWorkspace = jest.spyOn(DwApi, 'patchWorkspace').mockResolvedValueOnce(testWorkspace);
    });

    afterEach(() => {
      spyPatchWorkspace.mockClear();
      spyCreateWorkspace.mockClear();
    });

    it('should add annotation of last update time', async () => {
      await client.createFromDevfile(
        testDevfile,
        namespace,
        [],
        undefined,
        undefined,
        undefined,
        {},
      );

      expect(spyCreateWorkspace).toBeCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            annotations: {
              'che.eclipse.org/last-updated-timestamp': timestampNew,
            },
          }),
        }),
      );
    });

    it('should add editor annotation', async () => {
      await client.createFromDevfile(
        testDevfile,
        namespace,
        [],
        undefined,
        undefined,
        'eclipse/theia/next',
        {},
      );

      expect(spyCreateWorkspace).toBeCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            annotations: expect.objectContaining({
              'che.eclipse.org/che-editor': 'eclipse/theia/next',
            }),
          }),
        }),
      );
    });
  });

  describe('Create from resources', () => {
    let testDevWorkspace: devfileApi.DevWorkspace;
    let testDevWorkspaceTemplate: devfileApi.DevWorkspaceTemplate;
    let spyPatchWorkspace: jest.SpyInstance;
    let spyCreateWorkspace: jest.SpyInstance;
    let spyCreateWorkspaceTemplate: jest.SpyInstance;

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
          template: {},
        },
      };
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
      };
      spyPatchWorkspace = jest
        .spyOn(DwApi, 'patchWorkspace')
        .mockResolvedValueOnce(testDevWorkspace);
      const workspace = new DevWorkspaceBuilder()
        .withMetadata({
          namespace,
          name: 'wksp-name-cvbn',
          uid: 'uid-asdfgh12345',
        })
        .build();
      spyCreateWorkspace = jest.spyOn(DwApi, 'createWorkspace').mockResolvedValueOnce(workspace);
      spyCreateWorkspaceTemplate = jest
        .spyOn(DwtApi, 'createTemplate')
        .mockResolvedValueOnce(testDevWorkspaceTemplate);
    });

    afterEach(() => {
      spyPatchWorkspace.mockClear();
      spyCreateWorkspace.mockClear();
      spyCreateWorkspaceTemplate.mockClear();
    });

    it('should add annotation of last update time', async () => {
      await client.createFromResources(
        namespace,
        testDevWorkspace,
        testDevWorkspaceTemplate,
        undefined,
        undefined,
        undefined,
      );

      expect(spyCreateWorkspace).toBeCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            annotations: {
              'che.eclipse.org/last-updated-timestamp': timestampNew,
            },
          }),
        }),
      );
    });

    it('should add pluginRegistry and dashboard URLs as environment variables', async () => {
      await client.createFromResources(
        namespace,
        testDevWorkspace,
        testDevWorkspaceTemplate,
        undefined,
        'http://plugin.registry.url',
        'http://internal.plugin.registry.url',
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
                  ]),
                }),
              }),
            ]),
          }),
        }),
      );
    });

    it('should add owner reference to devWorkspace template to allow automatic cleanup', async () => {
      await client.createFromResources(
        namespace,
        testDevWorkspace,
        testDevWorkspaceTemplate,
        undefined,
        undefined,
        undefined,
      );

      expect(spyCreateWorkspaceTemplate).toBeCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            ownerReferences: expect.arrayContaining([
              expect.objectContaining({
                name: 'wksp-name-cvbn',
                uid: 'uid-asdfgh12345',
              }),
            ]),
          }),
        }),
      );
    });
  });
});
