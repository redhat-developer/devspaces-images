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

import common from '@eclipse-che/common';
import mockAxios from 'axios';
import { dump } from 'js-yaml';

import devfileApi from '@/services/devfileApi';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { getEditor } from '@/store/DevfileRegistries/getEditor';

describe('Get Devfile by URL', () => {
  let editor: devfileApi.Devfile;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    editor = buildEditor();

    mockFetch = mockAxios.get as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      data: dump(editor),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should throw the "plugin registry URL is required" error message', async () => {
    const store = new FakeStoreBuilder().build();

    let errorText: string | undefined = undefined;
    try {
      await getEditor('che-incubator/che-idea/next', store.dispatch, store.getState);
    } catch (e) {
      errorText = common.helpers.errors.getMessage(e);
    }

    expect(errorText).toEqual('Plugin registry URL is required.');
  });

  it('Should throw the "failed to fetch editor yaml" error message', async () => {
    const store = new FakeStoreBuilder().build();

    let errorText: string | undefined = undefined;
    try {
      await getEditor(
        'che-incubator/che-idea/next',
        store.dispatch,
        store.getState,
        'https://dummy/che-plugin-registry/main/v3',
      );
    } catch (e) {
      errorText = common.helpers.errors.getMessage(e);
    }

    expect(errorText).toEqual(
      'Failed to fetch editor yaml by URL: https://dummy/che-plugin-registry/main/v3/plugins/che-incubator/che-idea/next/devfile.yaml.',
    );
  });

  it('Should request a devfile content by editor id', async () => {
    const store = new FakeStoreBuilder().build();

    try {
      await getEditor(
        'che-incubator/che-idea/next',
        store.dispatch,
        store.getState,
        'https://dummy/che-plugin-registry/main/v3',
      );
    } catch (e) {
      // no-op
    }

    expect(mockFetch.mock.calls).toEqual([
      [
        'https://dummy/che-plugin-registry/main/v3/plugins/che-incubator/che-idea/next/devfile.yaml',
      ],
    ]);
  });

  it('Should request a devfile content by editor path', async () => {
    const store = new FakeStoreBuilder().build();

    try {
      await getEditor(
        'https://dummy/che-plugin-registry/main/v3/plugins/che-incubator/che-idea/next/devfile.yaml',
        store.dispatch,
        store.getState,
      );
    } catch (e) {
      // no-op
    }

    expect(mockFetch.mock.calls).toEqual([
      [
        'https://dummy/che-plugin-registry/main/v3/plugins/che-incubator/che-idea/next/devfile.yaml',
      ],
    ]);
  });

  it('Should return an existing devfile content by editor id', async () => {
    const store = new FakeStoreBuilder()
      .withDevfileRegistries({
        devfiles: {
          ['https://dummy/che-plugin-registry/main/v3/plugins/che-incubator/che-idea/next/devfile.yaml']:
            {
              content: dump(editor),
            },
        },
      })
      .build();

    const customEditor = await getEditor(
      'che-incubator/che-idea/next',
      store.dispatch,
      store.getState,
      'https://dummy/che-plugin-registry/main/v3',
    );

    expect(mockFetch.mock.calls).toEqual([]);
    expect(customEditor.content).toEqual(dump(editor));
    expect(customEditor.editorYamlUrl).toEqual(
      'https://dummy/che-plugin-registry/main/v3/plugins/che-incubator/che-idea/next/devfile.yaml',
    );
  });

  it('Should return an existing devfile content by editor path', async () => {
    const store = new FakeStoreBuilder()
      .withDevfileRegistries({
        devfiles: {
          ['https://dummy/che-plugin-registry/main/v3/plugins/che-incubator/che-idea/next/devfile.yaml']:
            {
              content: dump(editor),
            },
        },
      })
      .build();

    const customEditor = await getEditor(
      'https://dummy/che-plugin-registry/main/v3/plugins/che-incubator/che-idea/next/devfile.yaml',
      store.dispatch,
      store.getState,
    );

    expect(mockFetch.mock.calls).toEqual([]);
    expect(customEditor.content).toEqual(dump(editor));
    expect(customEditor.editorYamlUrl).toEqual(
      'https://dummy/che-plugin-registry/main/v3/plugins/che-incubator/che-idea/next/devfile.yaml',
    );
  });
});

function buildEditor(): devfileApi.Devfile {
  return {
    schemaVersion: '2.1.0',
    metadata: {
      name: 'ws-skeleton/eclipseide/4.9.0',
      namespace: 'che',
    },
    components: [
      {
        name: 'eclipse-ide',
        container: {
          image: 'docker.io/wsskeleton/eclipse-broadway',
          mountSources: true,
          memoryLimit: '2048M',
        },
      },
    ],
  };
}
