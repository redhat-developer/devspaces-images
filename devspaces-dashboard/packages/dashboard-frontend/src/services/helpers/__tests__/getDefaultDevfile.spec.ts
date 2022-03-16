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

import getDefaultDevfile from '../getDefaultDevfile';

describe('getDefaultDevfile', () => {
  it('should return devfile v2', () => {
    const isDevworkspacesEnabled = true;
    const preferredStorageType = 'ephemeral';
    const devfile = getDefaultDevfile(isDevworkspacesEnabled, preferredStorageType);

    expect(devfile).toEqual({
      schemaVersion: '2.1.0',
      metadata: {
        name: expect.stringMatching(/^wksp-/),
      },
    });
  });
  it('should return devfile v1', () => {
    const isDevworkspacesEnabled = false;
    const preferredStorageType = 'ephemeral';
    const devfile = getDefaultDevfile(isDevworkspacesEnabled, preferredStorageType);

    expect(devfile).toEqual({
      apiVersion: '1.0.0',
      attributes: {
        persistVolumes: 'false',
      },
      metadata: {
        generateName: 'wksp-',
      },
    });
  });
});
