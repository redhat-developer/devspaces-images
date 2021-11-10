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

import { updateDevfile } from '../storageTypes';
import { DevfileBuilder } from '../../store/__mocks__/devfile';

describe('Storage Types Service', () => {
  describe('updateDevfile()', () => {
    describe('setting the "persistent" storage', () => {
      const expectedAttr = undefined;

      it('should correctly update a devfile without volumes', () => {
        const devfile = getDevfileWithoutAttributes();
        const newDevfile = updateDevfile(devfile, 'persistent');

        expect(newDevfile.attributes).toEqual(expectedAttr);
        expect(newDevfile).toEqual(devfile);
      });

      it('should correctly update a devfile with "persistent" storage', () => {
        const devfile = getDevfileWithPersistentStorage();
        const newDevfile = updateDevfile(devfile, 'persistent');

        expect(newDevfile.attributes).toEqual(expectedAttr);
      });

      it('should correctly update a devfile with "ephemeral" storage', () => {
        const devfile = getDevfileWithEphemeralStorage();
        const newDevfile = updateDevfile(devfile, 'persistent');

        expect(newDevfile.attributes).toEqual(expectedAttr);
      });

      it('should correctly update a devfile with "async" storage', () => {
        const devfile = getDevfileWithAsyncStorage();
        const newDevfile = updateDevfile(devfile, 'persistent');

        expect(newDevfile.attributes).toEqual(expectedAttr);
      });
    });

    describe('setting the "ephemeral" storage', () => {
      const expectedAttr: che.WorkspaceDevfileAttributes = {
        persistVolumes: 'false',
      };

      it('should correctly update a devfile without volumes', () => {
        const devfile = getDevfileWithoutAttributes();
        const newDevfile = updateDevfile(devfile, 'ephemeral');

        expect(newDevfile.attributes).toEqual(expectedAttr);
      });

      it('should correctly update a devfile with "persistent" storage', () => {
        const devfile = getDevfileWithPersistentStorage();
        const newDevfile = updateDevfile(devfile, 'ephemeral');

        expect(newDevfile.attributes).toEqual(expectedAttr);
      });

      it('should correctly update a devfile with "ephemeral" storage', () => {
        const devfile = getDevfileWithEphemeralStorage();
        const newDevfile = updateDevfile(devfile, 'ephemeral');

        expect(newDevfile.attributes).toEqual(expectedAttr);
        expect(newDevfile).toEqual(devfile);
      });

      it('should correctly update a devfile with "async" storage', () => {
        const devfile = getDevfileWithAsyncStorage();
        const newDevfile = updateDevfile(devfile, 'ephemeral');

        expect(newDevfile.attributes).toEqual(expectedAttr);
      });
    });

    describe('setting the "async" storage', () => {
      const expectedAttr: che.WorkspaceDevfileAttributes = {
        persistVolumes: 'false',
        asyncPersist: 'true',
      };

      it('should correctly update a devfile without volumes', () => {
        const devfile = getDevfileWithoutAttributes();
        const newDevfile = updateDevfile(devfile, 'async');

        expect(newDevfile.attributes).toEqual(expectedAttr);
      });

      it('should correctly update a devfile with "persistent" storage', () => {
        const devfile = getDevfileWithPersistentStorage();
        const newDevfile = updateDevfile(devfile, 'async');

        expect(newDevfile.attributes).toEqual(expectedAttr);
      });

      it('should correctly update a devfile with "ephemeral" storage', () => {
        const devfile = getDevfileWithEphemeralStorage();
        const newDevfile = updateDevfile(devfile, 'async');

        expect(newDevfile.attributes).toEqual(expectedAttr);
      });

      it('should correctly update a devfile with "async" storage', () => {
        const devfile = getDevfileWithAsyncStorage();
        const newDevfile = updateDevfile(devfile, 'async');

        expect(newDevfile.attributes).toEqual(expectedAttr);
        expect(newDevfile).toEqual(devfile);
      });
    });
  });
});

function getDevfileWithoutAttributes(): che.WorkspaceDevfile {
  const devfile = new DevfileBuilder();
  return devfile.build();
}

function getDevfileWithPersistentStorage(): che.WorkspaceDevfile {
  const devfile = new DevfileBuilder().withAttributes({
    persistVolumes: 'true',
  });
  return devfile.build();
}

function getDevfileWithEphemeralStorage(): che.WorkspaceDevfile {
  const devfile = new DevfileBuilder().withAttributes({
    persistVolumes: 'false',
  });
  return devfile.build();
}

function getDevfileWithAsyncStorage(): che.WorkspaceDevfile {
  const devfile = new DevfileBuilder().withAttributes({
    persistVolumes: 'false',
    asyncPersist: 'true',
  });
  return devfile.build();
}
