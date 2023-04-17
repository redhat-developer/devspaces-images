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

import { DevfileBuilder } from '../../../store/__mocks__/devfile';
import { DEVWORKSPACE_STORAGE_TYPE_ATTR } from '../../devfileApi/devWorkspace/spec/template';
import { DevfileAdapter } from '../adapter';
import { convertDevfileV1toDevfileV2 } from '../converters';
import devfileApi from '../../devfileApi';

describe('DevfileAdapter Service', () => {
  describe('getAttributesFromDevfileV2', () => {
    it('should returns attributes from the devfile v2.0.0', async () => {
      const devfileV2 = {
        schemaVersion: '2.0.0',
        metadata: {
          name: 'wksp-test',
        },
      } as devfileApi.Devfile;
      const attributes = DevfileAdapter.getAttributesFromDevfileV2(devfileV2);

      expect(attributes === devfileV2.metadata.attributes).toBeTruthy();
      expect(attributes === devfileV2.attributes).toBeFalsy();
    });

    it('should returns attributes from the devfile v2.1.0', async () => {
      const devfileV2 = {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'wksp-test',
        },
      } as devfileApi.Devfile;
      const attributes = DevfileAdapter.getAttributesFromDevfileV2(devfileV2);

      expect(attributes === devfileV2.metadata.attributes).toBeFalsy();
      expect(attributes === devfileV2.attributes).toBeTruthy();
    });

    it('should returns attributes from the devfile v2.2.0', async () => {
      const devfileV2 = {
        schemaVersion: '2.2.0',
        metadata: {
          name: 'wksp-test',
        },
      } as devfileApi.Devfile;
      const attributes = DevfileAdapter.getAttributesFromDevfileV2(devfileV2);

      expect(attributes === devfileV2.metadata.attributes).toBeFalsy();
      expect(attributes === devfileV2.attributes).toBeTruthy();
    });
  });
  describe('update storageType', () => {
    describe('devfile V2', () => {
      describe('setting the "ephemeral" storage', () => {
        it('should correctly update a devfile with "ephemeral" storage', async () => {
          const devfileV2 = await convertDevfileV1toDevfileV2(getDevfileWithPersistentStorage());
          const devfileAdapter = new DevfileAdapter(devfileV2);

          expect(devfileAdapter.storageType).toEqual('persistent');
          expect(devfileAdapter.devfile.attributes).not.toEqual(
            expect.objectContaining({ [DEVWORKSPACE_STORAGE_TYPE_ATTR]: 'ephemeral' }),
          );

          devfileAdapter.storageType = 'ephemeral';

          expect(devfileAdapter.devfile.attributes).toEqual(
            expect.objectContaining({
              [DEVWORKSPACE_STORAGE_TYPE_ATTR]: 'ephemeral',
              'che-theia.eclipse.org/sidecar-policy': 'mergeImage',
            }),
          );
          expect(devfileAdapter.storageType).toEqual('ephemeral');
        });

        it('should correctly update a devfile with "ephemeral" storage', async () => {
          const devfileV2 = await convertDevfileV1toDevfileV2(getDevfileWithEphemeralStorage());

          const devfileAdapter = new DevfileAdapter(devfileV2);

          expect(devfileAdapter.storageType).toEqual('ephemeral');
          expect(devfileAdapter.devfile.attributes).toEqual(
            expect.objectContaining({
              [DEVWORKSPACE_STORAGE_TYPE_ATTR]: 'ephemeral',
            }),
          );

          devfileAdapter.storageType = 'per-workspace';

          expect(devfileAdapter.devfile.attributes).not.toEqual(
            expect.objectContaining({
              [DEVWORKSPACE_STORAGE_TYPE_ATTR]: 'ephemeral',
            }),
          );
          expect(devfileAdapter.storageType).toEqual('per-workspace');
        });
      });
    });
  });
});

function getDevfileWithPersistentStorage(): che.WorkspaceDevfile {
  const devfileV1 = new DevfileBuilder().withAttributes({
    persistVolumes: 'true',
  });
  return devfileV1.build();
}

function getDevfileWithEphemeralStorage(): che.WorkspaceDevfile {
  const devfileV1 = new DevfileBuilder().withAttributes({
    persistVolumes: 'false',
  });
  return devfileV1.build();
}
