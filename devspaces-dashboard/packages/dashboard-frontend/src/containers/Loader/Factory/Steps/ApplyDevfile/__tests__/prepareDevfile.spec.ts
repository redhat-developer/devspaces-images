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

import { dump } from 'js-yaml';
import devfileApi from '../../../../../../services/devfileApi';
import {
  DEVWORKSPACE_DEVFILE_SOURCE,
  DEVWORKSPACE_METADATA_ANNOTATION,
} from '../../../../../../services/workspace-client/devworkspace/devWorkspaceClient';
import { prepareDevfile } from '../prepareDevfile';
import { generateWorkspaceName } from '../../../../../../services/helpers/generateName';
import { DEVWORKSPACE_STORAGE_TYPE } from '../../../../../../services/devfileApi/devWorkspace/spec';

jest.mock('../../../../../../services/helpers/generateName');
(generateWorkspaceName as jest.Mock).mockImplementation(name => name + '1234');

describe('FactoryLoaderContainer/prepareDevfile', () => {
  describe('DEVWORKSPACE_METADATA_ANNOTATION attribute', () => {
    test('add the attribute with annotation', () => {
      const devfile = {
        metadata: {
          generateName: 'wksp-',
        },
      } as devfileApi.Devfile;
      const factoryId = 'url=https://devfile-location';
      const factorySource = {
        [DEVWORKSPACE_DEVFILE_SOURCE]: dump({
          factory: {
            params: factoryId,
          },
        }),
      };

      const newDevfile = prepareDevfile(devfile, factoryId, undefined, undefined);

      expect(newDevfile.metadata.attributes).toEqual({
        [DEVWORKSPACE_METADATA_ANNOTATION]: factorySource,
      });
    });

    test('update the attribute with annotation', () => {
      const customAnnotation = {
        'custom-annotation': 'value',
      };
      const factoryId = 'url=https://devfile-location';
      const factorySource = {
        [DEVWORKSPACE_DEVFILE_SOURCE]: dump({
          factory: {
            params: factoryId,
          },
        }),
      };

      const devfile = {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'asdf',
          generateName: 'wksp-',
          attributes: {
            [DEVWORKSPACE_METADATA_ANNOTATION]: customAnnotation,
          },
        },
      } as devfileApi.Devfile;

      const newDevfile = prepareDevfile(devfile, factoryId, undefined, undefined);

      expect((newDevfile.metadata.attributes as any)?.[DEVWORKSPACE_METADATA_ANNOTATION]).toEqual(
        expect.objectContaining(customAnnotation),
      );
      expect((newDevfile.metadata.attributes as any)?.[DEVWORKSPACE_METADATA_ANNOTATION]).toEqual(
        expect.objectContaining(factorySource),
      );
    });

    test('update the attribute with annotation - bad DEVWORKSPACE_METADATA_ANNOTATION', () => {
      const factoryId = 'url=https://devfile-location';
      const factorySource = {
        [DEVWORKSPACE_DEVFILE_SOURCE]: dump({
          factory: {
            params: factoryId,
          },
        }),
      };

      const badMetadataAnnotation = 'bad-metadata-annotation';

      const devfile = {
        metadata: {
          generateName: 'wksp-',
          attributes: {
            [DEVWORKSPACE_METADATA_ANNOTATION]: badMetadataAnnotation,
          },
        },
      } as devfileApi.Devfile;

      const newDevfile = prepareDevfile(devfile, factoryId, undefined, undefined);

      expect(
        (newDevfile.metadata.attributes as any)?.[DEVWORKSPACE_METADATA_ANNOTATION],
      ).not.toContain(badMetadataAnnotation);
      expect((newDevfile.metadata.attributes as any)?.[DEVWORKSPACE_METADATA_ANNOTATION]).toEqual(
        factorySource,
      );
    });

    test('update the attribute with annotation - bad DEVWORKSPACE_DEVFILE_SOURCE', () => {
      const factoryId = 'url=https://devfile-location';
      const factorySource = {
        [DEVWORKSPACE_DEVFILE_SOURCE]: dump({
          factory: {
            params: factoryId,
          },
        }),
      };

      const badDevworkspaceDevfileSource = {
        [DEVWORKSPACE_DEVFILE_SOURCE]: 'bad-devworkspace-devfile-source',
      };

      const devfile = {
        metadata: {
          generateName: 'wksp-',
          attributes: {
            [DEVWORKSPACE_METADATA_ANNOTATION]: badDevworkspaceDevfileSource,
          },
        },
      } as devfileApi.Devfile;

      const newDevfile = prepareDevfile(devfile, factoryId, undefined, undefined);

      expect(
        (newDevfile.metadata.attributes as any)?.[DEVWORKSPACE_METADATA_ANNOTATION],
      ).not.toContain(expect.objectContaining(badDevworkspaceDevfileSource));
      expect((newDevfile.metadata.attributes as any)?.[DEVWORKSPACE_METADATA_ANNOTATION]).toEqual(
        factorySource,
      );
    });
  });

  describe('devworkspace name', () => {
    test('policy "peruser"', () => {
      const factoryId = 'url=https://devfile-location';
      const devfile = {
        metadata: {
          name: 'wksp-test',
        },
      } as devfileApi.Devfile;

      const newDevfile = prepareDevfile(devfile, factoryId, undefined, undefined);

      expect(newDevfile.metadata.name).toEqual('wksp-test');
    });

    test('policy "perclick" - use "metadata.generateName"', () => {
      const factoryId = 'url=https://devfile-location';
      const devfile = {
        metadata: {
          generateName: 'wksp-',
          name: 'wksp-test',
        },
      } as devfileApi.Devfile;

      const newDevfile = prepareDevfile(devfile, factoryId, 'perclick', undefined);

      expect(newDevfile.metadata.name).toEqual('wksp-1234');
    });

    test('policy "perclick" - use "metadata.name"', () => {
      const factoryId = 'url=https://devfile-location';
      const devfile = {
        metadata: {
          name: 'wksp-test',
        },
      } as devfileApi.Devfile;

      const newDevfile = prepareDevfile(devfile, factoryId, 'perclick', undefined);

      expect(newDevfile.metadata.name).toEqual('wksp-test1234');
    });
  });

  describe('storage type', () => {
    const factoryId = 'url=https://devfile-location';
    const devfile = {
      schemaVersion: '2.1.0',
      metadata: {
        name: 'wksp-test',
      },
    } as devfileApi.Devfile;

    test('default storage type', () => {
      const newDevfile = prepareDevfile(devfile, factoryId, undefined, undefined);

      expect((newDevfile.metadata.attributes as any)?.[DEVWORKSPACE_STORAGE_TYPE]).toBeUndefined();
      expect((newDevfile.attributes as any)?.[DEVWORKSPACE_STORAGE_TYPE]).toBeUndefined();
    });

    test('non-default storage type', () => {
      const newDevfile = prepareDevfile(devfile, factoryId, undefined, 'ephemeral');

      expect((newDevfile.metadata.attributes as any)?.[DEVWORKSPACE_STORAGE_TYPE]).toBeUndefined();
      expect((newDevfile.attributes as any)?.[DEVWORKSPACE_STORAGE_TYPE]).toEqual('ephemeral');
    });
  });
});
