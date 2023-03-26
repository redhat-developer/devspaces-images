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

import { getCustomEditor, isForbidden, isInternalServerError, isUnauthorized } from '../helpers';
import { CHE_EDITOR_YAML_PATH } from '../';
import { dump } from 'js-yaml';
import common from '@eclipse-che/common';
import devfileApi from '../../devfileApi';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';

describe('Workspace-client helpers', () => {
  describe('checks for HTTP 401 Unauthorized response status code', () => {
    it('should return false in the case with HTTP 400 Bad Request', () => {
      expect(isUnauthorized('...HTTP Status 400 ....')).toBeFalsy();
      expect(
        isUnauthorized({
          body: '...HTTP Status 400 ....',
        }),
      ).toBeFalsy();
      expect(
        isUnauthorized({
          statusCode: 400,
        }),
      ).toBeFalsy();
      expect(
        isUnauthorized({
          status: 400,
        }),
      ).toBeFalsy();
      expect(isUnauthorized(new Error('...Status code 400...'))).toBeFalsy();
      expect(
        isUnauthorized({
          body: '...Status code 400...',
        }),
      ).toBeFalsy();
    });
    it('should return true in the case with HTTP 401 Unauthorized', () => {
      expect(isUnauthorized('...HTTP Status 401 ....')).toBeTruthy();
      expect(
        isUnauthorized({
          body: '...HTTP Status 401 ....',
        }),
      ).toBeTruthy();
      expect(
        isUnauthorized({
          statusCode: 401,
        }),
      ).toBeTruthy();
      expect(
        isUnauthorized({
          status: 401,
        }),
      ).toBeTruthy();
      expect(isUnauthorized(new Error('...Status code 401...'))).toBeTruthy();
      expect(
        isUnauthorized({
          body: '...Status code 401...',
        }),
      ).toBeTruthy();
    });
  });
  describe('checks for HTTP 403 Forbidden response status code', () => {
    it('should return false in the case with HTTP 400 Bad Request', () => {
      expect(isForbidden('...HTTP Status 400 ....')).toBeFalsy();
      expect(
        isForbidden({
          body: '...HTTP Status 400 ....',
        }),
      ).toBeFalsy();
      expect(
        isForbidden({
          statusCode: 400,
        }),
      ).toBeFalsy();
      expect(
        isForbidden({
          status: 400,
        }),
      ).toBeFalsy();
      expect(isForbidden(new Error('...Status code 400...'))).toBeFalsy();
      expect(
        isForbidden({
          body: '...Status code 400...',
        }),
      ).toBeFalsy();
    });
    it('should return true in the case with HTTP 403 Forbidden', () => {
      expect(isForbidden('...HTTP Status 403 ....')).toBeTruthy();
      expect(
        isForbidden({
          body: '...HTTP Status 403 ....',
        }),
      ).toBeTruthy();
      expect(
        isForbidden({
          statusCode: 403,
        }),
      ).toBeTruthy();
      expect(
        isForbidden({
          status: 403,
        }),
      ).toBeTruthy();
      expect(isForbidden(new Error('...Status code 403...'))).toBeTruthy();
      expect(
        isForbidden({
          body: '...Status code 403...',
        }),
      ).toBeTruthy();
    });
  });
  describe('checks for HTTP 500 Internal Server Error response status code', () => {
    it('should return false in the case with HTTP 400 Bad Request', () => {
      expect(isInternalServerError('...HTTP Status 400 ....')).toBeFalsy();
      expect(
        isInternalServerError({
          body: '...HTTP Status 400 ....',
        }),
      ).toBeFalsy();
      expect(
        isInternalServerError({
          statusCode: 400,
        }),
      ).toBeFalsy();
      expect(
        isInternalServerError({
          status: 400,
        }),
      ).toBeFalsy();
      expect(isInternalServerError(new Error('...Status code 400...'))).toBeFalsy();
      expect(
        isInternalServerError({
          body: '...Status code 400...',
        }),
      ).toBeFalsy();
    });
    it('should return true in the case with HTTP 500 Internal Server Error', () => {
      expect(isInternalServerError('...HTTP Status 500 ....')).toBeTruthy();
      expect(
        isInternalServerError({
          body: '...HTTP Status 500 ....',
        }),
      ).toBeTruthy();
      expect(
        isInternalServerError({
          statusCode: 500,
        }),
      ).toBeTruthy();
      expect(
        isInternalServerError({
          status: 500,
        }),
      ).toBeTruthy();
      expect(isInternalServerError(new Error('...Status code 500...'))).toBeTruthy();
      expect(
        isInternalServerError({
          body: '...Status code 500...',
        }),
      ).toBeTruthy();
    });
  });

  describe('Look for the custom editor', () => {
    const pluginRegistryUrl = 'https://dummy-plugin-registry';
    let optionalFilesContent: { [fileName: string]: string };
    let editor: devfileApi.Devfile;

    beforeEach(() => {
      optionalFilesContent = {};
      editor = buildEditor();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return undefined without optionalFilesContent', async () => {
      const store = new FakeStoreBuilder().build();
      const customEditor = await getCustomEditor(
        pluginRegistryUrl,
        optionalFilesContent,
        store.dispatch,
        store.getState,
      );

      expect(customEditor).toBeUndefined();
    });

    describe('inlined editor', () => {
      it('should return inlined editor without changes', async () => {
        optionalFilesContent[CHE_EDITOR_YAML_PATH] = dump({ inline: editor });
        const store = new FakeStoreBuilder().build();

        const customEditor = await getCustomEditor(
          pluginRegistryUrl,
          optionalFilesContent,
          store.dispatch,
          store.getState,
        );

        expect(customEditor).toEqual(dump(editor));
      });

      it('should return an overridden devfile', async () => {
        optionalFilesContent[CHE_EDITOR_YAML_PATH] = dump({
          inline: editor,
          override: {
            containers: [
              {
                name: 'eclipse-ide',
                memoryLimit: '1234Mi',
              },
            ],
          },
        });
        const store = new FakeStoreBuilder().build();

        const customEditor = await getCustomEditor(
          pluginRegistryUrl,
          optionalFilesContent,
          store.dispatch,
          store.getState,
        );

        expect(customEditor).toEqual(expect.stringContaining('memoryLimit: 1234Mi'));
      });

      it('should throw the "missing metadata.name" error message', async () => {
        // set an empty value as a name
        editor.metadata.name = '';
        optionalFilesContent[CHE_EDITOR_YAML_PATH] = dump({ inline: editor });
        const store = new FakeStoreBuilder().build();

        let errorText: string | undefined = undefined;

        try {
          await getCustomEditor(
            pluginRegistryUrl,
            optionalFilesContent,
            store.dispatch,
            store.getState,
          );
        } catch (e) {
          errorText = common.helpers.errors.getMessage(e);
        }

        expect(errorText).toEqual(
          'Failed to analyze the editor devfile, reason: Missing metadata.name attribute in the editor yaml file.',
        );
      });
    });

    describe('get editor by id ', () => {
      describe('from the default registry', () => {
        it('should return an editor without changes', async () => {
          optionalFilesContent[CHE_EDITOR_YAML_PATH] = dump({
            id: 'che-incubator/che-idea/next',
          });
          const store = new FakeStoreBuilder()
            .withDevfileRegistries({
              devfiles: {
                ['https://dummy-plugin-registry/plugins/che-incubator/che-idea/next/devfile.yaml']:
                  {
                    content: dump(editor),
                  },
              },
            })
            .build();

          const customEditor = await getCustomEditor(
            pluginRegistryUrl,
            optionalFilesContent,
            store.dispatch,
            store.getState,
          );

          expect(customEditor).toEqual(dump(editor));
        });

        it('should return an overridden devfile', async () => {
          optionalFilesContent[CHE_EDITOR_YAML_PATH] = dump({
            id: 'che-incubator/che-idea/next',
            override: {
              containers: [
                {
                  name: 'eclipse-ide',
                  memoryLimit: '1234Mi',
                },
              ],
            },
          });
          const store = new FakeStoreBuilder()
            .withDevfileRegistries({
              devfiles: {
                ['https://dummy-plugin-registry/plugins/che-incubator/che-idea/next/devfile.yaml']:
                  {
                    content: dump(editor),
                  },
              },
            })
            .build();

          const customEditor = await getCustomEditor(
            pluginRegistryUrl,
            optionalFilesContent,
            store.dispatch,
            store.getState,
          );

          expect(customEditor).toEqual(expect.stringContaining('memoryLimit: 1234Mi'));
        });

        it('should throw the "missing metadata.name" error message', async () => {
          // set an empty value as a name
          editor.metadata.name = '';
          optionalFilesContent[CHE_EDITOR_YAML_PATH] = dump({
            id: 'che-incubator/che-idea/next',
          });
          const store = new FakeStoreBuilder()
            .withDevfileRegistries({
              devfiles: {
                ['https://dummy-plugin-registry/plugins/che-incubator/che-idea/next/devfile.yaml']:
                  {
                    content: dump(editor),
                  },
              },
            })
            .build();

          let errorText: string | undefined = undefined;
          try {
            await getCustomEditor(
              pluginRegistryUrl,
              optionalFilesContent,
              store.dispatch,
              store.getState,
            );
          } catch (e) {
            errorText = common.helpers.errors.getMessage(e);
          }

          expect(errorText).toEqual(
            'Failed to analyze the editor devfile, reason: Missing metadata.name attribute in the editor yaml file.',
          );
        });
      });
      describe('from the custom registry', () => {
        it('should return an editor without changes', async () => {
          optionalFilesContent[CHE_EDITOR_YAML_PATH] = dump({
            id: 'che-incubator/che-idea/next',
            registryUrl: 'https://dummy/che-plugin-registry/main/v3',
          });
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

          const customEditor = await getCustomEditor(
            pluginRegistryUrl,
            optionalFilesContent,
            store.dispatch,
            store.getState,
          );

          expect(customEditor).toEqual(dump(editor));
        });

        it('should return an overridden devfile', async () => {
          optionalFilesContent[CHE_EDITOR_YAML_PATH] = dump({
            id: 'che-incubator/che-idea/next',
            registryUrl: 'https://dummy/che-plugin-registry/main/v3',
            override: {
              containers: [
                {
                  name: 'eclipse-ide',
                  memoryLimit: '1234Mi',
                },
              ],
            },
          });
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

          const customEditor = await getCustomEditor(
            pluginRegistryUrl,
            optionalFilesContent,
            store.dispatch,
            store.getState,
          );

          expect(customEditor).toEqual(expect.stringContaining('memoryLimit: 1234Mi'));
        });

        it('should throw the "missing metadata.name" error message', async () => {
          // set an empty value as a name
          editor.metadata.name = '';
          optionalFilesContent[CHE_EDITOR_YAML_PATH] = dump({
            id: 'che-incubator/che-idea/next',
            registryUrl: 'https://dummy/che-plugin-registry/main/v3',
          });
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

          let errorText: string | undefined = undefined;
          try {
            await getCustomEditor(
              pluginRegistryUrl,
              optionalFilesContent,
              store.dispatch,
              store.getState,
            );
          } catch (e) {
            errorText = common.helpers.errors.getMessage(e);
          }

          expect(errorText).toEqual(
            'Failed to analyze the editor devfile, reason: Missing metadata.name attribute in the editor yaml file.',
          );
        });
      });
    });
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
