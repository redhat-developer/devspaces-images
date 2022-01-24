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
import * as ServerConfigApi from '../../../dashboard-backend-client/serverConfigApi';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
describe('DevWorkspace client, start', () => {
  let client: DevWorkspaceClient;

  beforeEach(() => {
    client = container.get(DevWorkspaceClient);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should add default plugin uri', async () => {
    const namespace = 'che';
    const name = 'wksp-test';
    const testWorkspace = new DevWorkspaceBuilder()
      .withMetadata({
        name,
        namespace,
      })
      .build();
    const defaultPluginUri = 'https://test.com/devfile.yaml';
    const patchWorkspace = jest.spyOn(DwApi, 'patchWorkspace');

    const defaults = { 'eclipse/theia/next': [defaultPluginUri] };
    const editor = 'eclipse/theia/next';
    await client.onStart(testWorkspace, defaults, editor);
    expect(testWorkspace.spec.template.components!.length).toBe(1);
    expect(testWorkspace.spec.template.components![0].plugin!.uri!).toBe(defaultPluginUri);
    expect(
      (testWorkspace.spec.template.components![0].attributes as any)[
        'che.eclipse.org/default-plugin'
      ],
    ).toBe(true);
    expect(patchWorkspace).toHaveBeenCalled();
  });

  it('should remove default plugin uri when no default plugins exist', async () => {
    const namespace = 'che';
    const name = 'wksp-test';
    const testWorkspace = new DevWorkspaceBuilder()
      .withMetadata({
        name,
        namespace,
      })
      .withTemplate({
        components: [
          {
            name: 'default',
            attributes: { 'che.eclipse.org/default-plugin': true },
            plugin: { uri: 'https://test.com/devfile.yaml' },
          },
        ],
      })
      .build();

    const patchWorkspace = jest.spyOn(DwApi, 'patchWorkspace');
    const defaults = { 'eclipse/theia/next': [] };
    const editor = 'eclipse/theia/next';
    await client.onStart(testWorkspace, defaults, editor);
    expect(testWorkspace.spec.template.components!.length).toBe(0);
    expect(patchWorkspace).toHaveBeenCalled();
  });

  it('should not remove non default plugin uri when no default plugins exist', async () => {
    const namespace = 'che';
    const name = 'wksp-test';
    const uri = 'https://test.com/devfile.yaml';
    const testWorkspace = new DevWorkspaceBuilder()
      .withMetadata({
        name,
        namespace,
      })
      .withTemplate({
        components: [
          {
            name: 'my-plugin',
            plugin: { uri },
          },
        ],
      })
      .build();

    const patchWorkspace = jest.spyOn(DwApi, 'patchWorkspace');
    const defaults = { 'eclipse/theia/next': [] };
    const editor = 'eclipse/theia/next';
    await client.onStart(testWorkspace, defaults, editor);
    expect(testWorkspace.spec.template.components!.length).toBe(1);
    expect(testWorkspace.spec.template.components![0].plugin!.uri!).toBe(uri);
    expect(testWorkspace.spec.template.components![0].attributes).toBeUndefined();
    expect(patchWorkspace).toHaveBeenCalledTimes(0);
  });

  it('should not remove non default plugin uri if attribute is false', async () => {
    const namespace = 'che';
    const name = 'wksp-test';
    const uri = 'https://test.com/devfile.yaml';
    const testWorkspace = new DevWorkspaceBuilder()
      .withMetadata({
        name,
        namespace,
      })
      .withTemplate({
        components: [
          {
            name: 'default',
            attributes: { 'che.eclipse.org/default-plugin': false },
            plugin: { uri },
          },
        ],
      })
      .build();

    const patchWorkspace = jest.spyOn(DwApi, 'patchWorkspace');
    const defaults = { 'eclipse/theia/next': [] };
    const editor = 'eclipse/theia/next';
    await client.onStart(testWorkspace, defaults, editor);
    expect(testWorkspace.spec.template.components!.length).toBe(1);
    expect(testWorkspace.spec.template.components![0].plugin!.uri!).toBe(uri);
    expect(patchWorkspace).toHaveBeenCalledTimes(0);
  });

  it('should not call ServerConfigApi.getDefaultPlugins', async () => {
    const namespace = 'che';
    const name = 'wksp-test';
    const testWorkspace = new DevWorkspaceBuilder()
      .withMetadata({
        name,
        namespace,
      })
      .build();

    const getDefaultPlugins = jest.spyOn(ServerConfigApi, 'getDefaultPlugins');
    const defaults = {};
    const editor = 'eclipse/theia/next';
    await client.onStart(testWorkspace, defaults, editor);
    expect(getDefaultPlugins).toHaveBeenCalledTimes(0);
  });
});
