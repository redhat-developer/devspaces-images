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

import { DevfileBuilder } from '../../../store/__mocks__/devfile';
import { DevfileAdapter } from '../adapter';
import { convertDevfileV1toDevfileV2 } from '../converters';
import { DEVWORKSPACE_STORAGE_TYPE } from '../../devfileApi/devWorkspace/spec';

describe('DevfileAdapter Service', () => {
  describe('update storageType', () => {
    describe('devfile V1', () => {
      describe('setting the "persistent" storage', () => {
        it('should correctly update a devfile with "persistent" storage', () => {
          const devfileV1 = getDevfileWithPersistentStorage();
          const devfileAdapter = new DevfileAdapter(devfileV1);

          devfileAdapter.storageType = 'persistent';

          expect(devfileAdapter.devfile.attributes).toBeUndefined();
        });

        it('should correctly update a devfile with "ephemeral" storage', () => {
          const devfileV1 = getDevfileWithEphemeralStorage();
          const devfileAdapter = new DevfileAdapter(devfileV1);

          devfileAdapter.storageType = 'persistent';

          expect(devfileAdapter.devfile.attributes).toBeUndefined();
        });

        it('should correctly update a devfile with "async" storage', () => {
          const devfileV1 = getDevfileWithAsyncStorage();
          const devfileAdapter = new DevfileAdapter(devfileV1);

          devfileAdapter.storageType = 'persistent';

          expect(devfileAdapter.devfile.attributes).toBeUndefined();
        });
      });

      describe('setting the "ephemeral" storage', () => {
        it('should correctly update a devfile with "persistent" storage', () => {
          const devfileV1 = getDevfileWithPersistentStorage();
          const devfileAdapter = new DevfileAdapter(devfileV1);

          devfileAdapter.storageType = 'ephemeral';

          expect(devfileAdapter.devfile.attributes).toEqual({
            persistVolumes: 'false',
          });
        });

        it('should correctly update a devfile with "ephemeral" storage', () => {
          const devfileV1 = getDevfileWithEphemeralStorage();
          const devfileAdapter = new DevfileAdapter(devfileV1);

          devfileAdapter.storageType = 'ephemeral';

          expect(devfileAdapter.devfile.attributes).toEqual({
            persistVolumes: 'false',
          });
          expect(devfileAdapter.devfile).toEqual(devfileV1);
        });

        it('should correctly update a devfile with "async" storage', () => {
          const devfileV1 = getDevfileWithAsyncStorage();
          const devfileAdapter = new DevfileAdapter(devfileV1);

          devfileAdapter.storageType = 'ephemeral';

          expect(devfileAdapter.devfile.attributes).toEqual({
            persistVolumes: 'false',
          });
        });
      });

      describe('setting the "async" storage', () => {
        it('should correctly update a devfile with "persistent" storage', () => {
          const devfileV1 = getDevfileWithPersistentStorage();
          const devfileAdapter = new DevfileAdapter(devfileV1);

          expect(devfileAdapter.storageType).toEqual('persistent');
          expect(devfileAdapter.devfile.attributes).toEqual({
            persistVolumes: 'true',
          });

          devfileAdapter.storageType = 'async';

          expect(devfileAdapter.devfile.attributes).toEqual({
            persistVolumes: 'false',
            asyncPersist: 'true',
          });
          expect(devfileAdapter.storageType).toEqual('async');
        });

        it('should correctly update a devfile with "ephemeral" storage', () => {
          const devfileV1 = getDevfileWithEphemeralStorage();
          const devfileAdapter = new DevfileAdapter(devfileV1);

          expect(devfileAdapter.storageType).toEqual('ephemeral');
          expect(devfileAdapter.devfile.attributes).toEqual({
            persistVolumes: 'false',
          });

          devfileAdapter.storageType = 'async';

          expect(devfileAdapter.devfile.attributes).toEqual({
            persistVolumes: 'false',
            asyncPersist: 'true',
          });
          expect(devfileAdapter.storageType).toEqual('async');
        });
      });
    });

    describe('devfile V2', () => {
      describe('setting the "ephemeral" storage', () => {
        it('should correctly update a devfile with "ephemeral" storage', async () => {
          const devfileV2 = await convertDevfileV1toDevfileV2(getDevfileWithPersistentStorage());
          const devfileAdapter = new DevfileAdapter(devfileV2);

          expect(devfileAdapter.storageType).toEqual('persistent');
          expect(devfileAdapter.devfile.attributes).not.toEqual(
            expect.objectContaining({ [DEVWORKSPACE_STORAGE_TYPE]: 'ephemeral' }),
          );

          devfileAdapter.storageType = 'ephemeral';

          expect(devfileAdapter.devfile.attributes).toEqual(
            expect.objectContaining({
              [DEVWORKSPACE_STORAGE_TYPE]: 'ephemeral',
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
              [DEVWORKSPACE_STORAGE_TYPE]: 'ephemeral',
            }),
          );

          devfileAdapter.storageType = 'persistent';

          expect(devfileAdapter.devfile.attributes).not.toEqual(
            expect.objectContaining({
              [DEVWORKSPACE_STORAGE_TYPE]: 'ephemeral',
            }),
          );
          expect(devfileAdapter.storageType).toEqual('persistent');
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

function getDevfileWithAsyncStorage(): che.WorkspaceDevfile {
  const devfileV1 = new DevfileBuilder().withAttributes({
    persistVolumes: 'false',
    asyncPersist: 'true',
  });
  return devfileV1.build();
}
