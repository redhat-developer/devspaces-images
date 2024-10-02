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

import common from '@eclipse-che/common';

import devfileApi from '@/services/devfileApi';
import { che } from '@/services/models';
import { convertToEditorPlugin } from '@/store/Plugins/chePlugins/helpers';

describe('convertToEditorPlugin', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('should throw the error', () => {
    let editor: devfileApi.Devfile;
    let plugin: che.Plugin | undefined;
    let errorMessage: string | undefined;

    beforeEach(() => {
      plugin = undefined;
      errorMessage = undefined;
      editor = getEditor();
    });

    test('if metadata.name is empty', () => {
      editor.metadata.name = '';

      try {
        plugin = convertToEditorPlugin(editor);
      } catch (e) {
        errorMessage = common.helpers.errors.getMessage(e);
      }

      expect(plugin).toBeUndefined();
      expect(errorMessage).toBe('Invalid editor metadata');
    });

    test('if metadata.attributes.version is undefined', () => {
      editor.metadata.attributes.version = undefined;

      try {
        plugin = convertToEditorPlugin(editor);
      } catch (e) {
        errorMessage = common.helpers.errors.getMessage(e);
      }

      expect(plugin).toBeUndefined();
      expect(errorMessage).toBe('Invalid editor metadata');
    });

    test('if metadata.attributes.publisher is undefined', () => {
      editor.metadata.attributes.publisher = undefined;

      try {
        plugin = convertToEditorPlugin(editor);
      } catch (e) {
        errorMessage = common.helpers.errors.getMessage(e);
      }

      expect(plugin).toBeUndefined();
      expect(errorMessage).toBe('Invalid editor metadata');
    });
  });

  test('returns correct editor plugin', async () => {
    const editor = getEditor();

    const plugin = convertToEditorPlugin(editor);

    expect(plugin).toEqual({
      description:
        'Microsoft Visual Studio Code - Open Source IDE for Eclipse Che - Insiders build',
      displayName: 'VS Code - Open Source',
      icon: `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"></svg>`,
      iconMediatype: 'image/svg+xml',
      id: 'che-incubator/che-code/insiders',
      links: {
        devfile: '',
      },
      name: 'che-code',
      publisher: 'che-incubator',
      tags: ['Tech-Preview'],
      type: 'Che Editor',
      version: 'insiders',
    });
  });
});

function getEditor(): devfileApi.Devfile {
  return {
    commands: [
      {
        apply: {
          component: 'che-code-injector',
        },
        id: 'init-container-command',
      },
    ],
    components: [
      {
        container: {
          command: ['/entrypoint-init-container.sh'],
          image: 'quay.io/che-incubator/che-code:insiders',
        },
        name: 'che-code-injector',
      },
    ],
    metadata: {
      attributes: {
        firstPublicationDate: '2021-10-31',
        iconData:
          '<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"></svg>',
        iconMediatype: 'image/svg+xml',
        publisher: 'che-incubator',
        repository: 'https://github.com/che-incubator/che-code',
        title: 'Microsoft Visual Studio Code - Open Source IDE for Eclipse Che - Insiders build',
        version: 'insiders',
      },
      description:
        'Microsoft Visual Studio Code - Open Source IDE for Eclipse Che - Insiders build',
      displayName: 'VS Code - Open Source',
      name: 'che-code',
      tags: ['Tech-Preview'],
    },
    schemaVersion: '2.2.2',
  } as devfileApi.Devfile;
}
