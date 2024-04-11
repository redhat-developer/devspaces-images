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

import { DevfileAdapter } from '@/services/devfile/adapter';
import devfileApi from '@/services/devfileApi';

describe('DevfileAdapter Service', () => {
  describe('getAttributesFromDevfileV2', () => {
    it('should return attributes from the devfile v2.0.0', async () => {
      const devfile = {
        schemaVersion: '2.0.0',
        metadata: {
          name: 'wksp-test',
        },
      } as devfileApi.Devfile;

      const adapter = new DevfileAdapter(devfile);

      expect(adapter.attributes).toStrictEqual(devfile.metadata.attributes);
      expect(adapter.attributes).not.toStrictEqual(devfile.attributes);
    });

    it('should return attributes from the devfile v2.1.0', async () => {
      const devfile = {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'wksp-test',
        },
      } as devfileApi.Devfile;

      const adapter = new DevfileAdapter(devfile);

      expect(adapter.attributes).not.toStrictEqual(devfile.metadata.attributes);
      expect(adapter.attributes).toStrictEqual(devfile.attributes);
    });

    it('should returns attributes from the devfile v2.2.0', async () => {
      const devfile = {
        schemaVersion: '2.2.0',
        metadata: {
          name: 'wksp-test',
        },
      } as devfileApi.Devfile;
      const adapter = new DevfileAdapter(devfile);

      expect(adapter.attributes).not.toStrictEqual(devfile.metadata.attributes);
      expect(adapter.attributes).toStrictEqual(devfile.attributes);
    });
  });
});
