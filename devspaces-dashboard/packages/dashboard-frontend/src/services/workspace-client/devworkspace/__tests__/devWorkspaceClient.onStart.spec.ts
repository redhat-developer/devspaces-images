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
import { DevWorkspaceBuilder } from '../../../../store/__mocks__/devWorkspaceBuilder';
import { DevWorkspaceClient } from '../devWorkspaceClient';
import * as DwApi from '../../../dashboard-backend-client/devWorkspaceApi';
import mockAxios from 'axios';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
describe('DevWorkspace client, start', () => {
  let client: DevWorkspaceClient;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockPatch = mockAxios.patch as jest.Mock;
    mockPatch.mockResolvedValue({ data: undefined });

    client = container.get(DevWorkspaceClient);
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

    expect(testWorkspace.spec.contributions?.length).toBe(1);
    expect(testWorkspace.spec.contributions![0].uri!).toBe(defaultPluginUri);
    expect(
      (testWorkspace.spec.contributions![0].attributes as any)['che.eclipse.org/default-plugin'],
    ).toBe(true);
    expect(patchWorkspace).toHaveBeenCalled();
  });

  it('should not add default plugin uri if editor is not provided', async () => {
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
    const editor = undefined;

    await client.onStart(testWorkspace, defaults, editor);

    // expect that no plug-in has been added
    expect(testWorkspace.spec.contributions).toBeUndefined();
    expect(patchWorkspace).toHaveBeenCalledTimes(0);
  });

  it('should not add default plugin uri if no default plugins for the editor are provided', async () => {
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

    // different editor
    const editor = 'eclipse/theia/latest';

    await client.onStart(testWorkspace, defaults, editor);

    // expect that no plug-in has been added
    expect(testWorkspace.spec.contributions).toBeUndefined();
    expect(patchWorkspace).toHaveBeenCalledTimes(0);
  });

  it('should remove default plugin uri when no default plugins exist for the specified editor', async () => {
    const namespace = 'che';
    const name = 'wksp-test';
    const testWorkspace = new DevWorkspaceBuilder()
      .withMetadata({
        name,
        namespace,
      })
      .withContributions([
        {
          name: 'default',
          uri: 'https://test.com/devfile.yaml',
          attributes: { 'che.eclipse.org/default-plugin': true },
        },
      ])
      .build();

    const patchWorkspace = jest.spyOn(DwApi, 'patchWorkspace');
    const defaults = { 'eclipse/theia/next': [] };
    const editor = 'eclipse/theia/next';

    await client.onStart(testWorkspace, defaults, editor);

    expect(testWorkspace.spec.contributions?.length).toBe(0);
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
      .withContributions([
        {
          name: 'default',
          uri: 'https://test.com/devfile.yaml',
          attributes: { 'che.eclipse.org/default-plugin': true },
        },
      ])
      .build();

    const patchWorkspace = jest.spyOn(DwApi, 'patchWorkspace');
    const defaults = {};
    const editor = 'eclipse/theia/next';

    await client.onStart(testWorkspace, defaults, editor);

    expect(testWorkspace.spec.contributions?.length).toBe(0);
    expect(patchWorkspace).toHaveBeenCalled();
  });

  it('should remove default plugin uri in spec.template.components and add to spec.contributions', async () => {
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
    const defaultPluginUri = 'https://test.com/devfile.yaml';
    const defaults = { 'eclipse/theia/next': [defaultPluginUri] };
    const editor = 'eclipse/theia/next';

    await client.onStart(testWorkspace, defaults, editor);

    expect(testWorkspace.spec.template.components?.length).toBe(0);

    expect(testWorkspace.spec.contributions?.length).toBe(1);
    expect(testWorkspace.spec.contributions![0].uri!).toBe(defaultPluginUri);
    expect(
      (testWorkspace.spec.contributions![0].attributes as any)['che.eclipse.org/default-plugin'],
    ).toBe(true);

    expect(patchWorkspace).toHaveBeenCalledTimes(2);
  });

  it('should not remove non default plugin component', async () => {
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
            name: 'universal-developer-image',
            container: {
              image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
            },
          },
        ],
      })
      .build();

    const patchWorkspace = jest.spyOn(DwApi, 'patchWorkspace');
    const defaults = { 'eclipse/theia/next': [] };
    const editor = 'eclipse/theia/next';

    await client.onStart(testWorkspace, defaults, editor);

    expect(testWorkspace.spec.template.components?.length).toBe(1);
    expect(testWorkspace.spec.template.components![0].name).toBe('universal-developer-image');
    expect(patchWorkspace).toHaveBeenCalledTimes(0);
  });

  it('should not remove non default plugin uri component', async () => {
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

    expect(testWorkspace.spec.template.components?.length).toBe(1);
    expect(testWorkspace.spec.template.components![0].plugin!.uri!).toBe(uri);
    expect(testWorkspace.spec.template.components![0].attributes).toBeUndefined();
    expect(patchWorkspace).toHaveBeenCalledTimes(0);
  });

  it('should not remove non default plugin uri contribution when no default plugins exist', async () => {
    const namespace = 'che';
    const name = 'wksp-test';
    const uri = 'https://test.com/devfile.yaml';
    const testWorkspace = new DevWorkspaceBuilder()
      .withMetadata({
        name,
        namespace,
      })
      .withContributions([
        {
          name: 'some-plugin',
          uri: 'https://test.com/devfile.yaml',
        },
      ])
      .build();

    const patchWorkspace = jest.spyOn(DwApi, 'patchWorkspace');
    const defaults = { 'eclipse/theia/next': [] };
    const editor = 'eclipse/theia/next';

    await client.onStart(testWorkspace, defaults, editor);

    expect(testWorkspace.spec.contributions?.length).toBe(1);
    expect(testWorkspace.spec.contributions![0].uri!).toBe(uri);
    expect(testWorkspace.spec.contributions![0].attributes).toBeUndefined();
    expect(patchWorkspace).toHaveBeenCalledTimes(0);
  });

  it('should not remove plugin uri if attribute is false', async () => {
    const namespace = 'che';
    const name = 'wksp-test';
    const uri = 'https://test.com/devfile.yaml';
    const testWorkspace = new DevWorkspaceBuilder()
      .withMetadata({
        name,
        namespace,
      })
      .withContributions([
        {
          name: 'default',
          uri: 'https://test.com/devfile.yaml',
          attributes: { 'che.eclipse.org/default-plugin': false },
        },
      ])
      .build();

    const patchWorkspace = jest.spyOn(DwApi, 'patchWorkspace');
    const defaults = { 'eclipse/theia/next': [] };
    const editor = 'eclipse/theia/next';

    await client.onStart(testWorkspace, defaults, editor);

    expect(testWorkspace.spec.contributions?.length).toBe(1);
    expect(testWorkspace.spec.contributions![0].uri!).toBe(uri);
    expect(patchWorkspace).toHaveBeenCalledTimes(0);
  });

  it('should not do anything if default uri plugin already exists', async () => {
    const namespace = 'che';
    const name = 'wksp-test';
    const testWorkspace = new DevWorkspaceBuilder()
      .withMetadata({
        name,
        namespace,
      })
      .withContributions([
        {
          name: 'default',
          uri: 'https://test.com/devfile.yaml',
          attributes: { 'che.eclipse.org/default-plugin': true },
        },
      ])
      .build();

    const patchWorkspace = jest.spyOn(DwApi, 'patchWorkspace');

    const defaultUri = 'https://test.com/devfile.yaml';
    const editor = 'eclipse/theia/next';
    const defaults = { [editor]: [defaultUri] };

    await client.onStart(testWorkspace, defaults, editor);

    expect(testWorkspace.spec.contributions?.length).toBe(1);
    expect(testWorkspace.spec.contributions![0].uri!).toBe(defaultUri);
    expect(patchWorkspace).toHaveBeenCalledTimes(0);
  });

  it('should ignore default uri plugin if uri is not valid', async () => {
    const namespace = 'che';
    const name = 'wksp-test';
    const validUri = 'https://test.com/devfile.yaml';
    const testWorkspace = new DevWorkspaceBuilder()
      .withMetadata({
        name,
        namespace,
      })
      .withContributions([
        {
          name: 'default',
          uri: validUri,
          attributes: { 'che.eclipse.org/default-plugin': true },
        },
      ])
      .build();

    const patchWorkspace = jest.spyOn(DwApi, 'patchWorkspace');

    const editor = 'eclipse/theia/next';
    const invalidUri = '1234';
    const defaults = { [editor]: [invalidUri, validUri] };

    await client.onStart(testWorkspace, defaults, editor);

    // invalid uri is ignored, valid uri default plugin remains in workspace
    expect(testWorkspace.spec.contributions?.length).toBe(1);
    expect(testWorkspace.spec.contributions![0].uri!).toBe(validUri);
    expect(patchWorkspace).toHaveBeenCalledTimes(0);
  });
});
