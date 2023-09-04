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

import {
  sanitizeLocation,
  sanitizeSearchParams,
  sanitizePathname,
} from '../sanitize';

describe('sanitize', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sanitizeLocation', () => {
    it('sanitizeLocation', () => {
      const location = {
        search:
          'url=https%3A%2F%2Fgithub.com%2Ftest-samples&storageType=persistent',
        pathname: '/f',
      };

      const sanitizedLocation = sanitizeLocation(location);

      expect(sanitizedLocation).toEqual(
        expect.objectContaining({
          search:
            'url=https%3A%2F%2Fgithub.com%2Ftest-samples&storageType=persistent',
          pathname: '/f',
        }),
      );
    });
  });

  describe('sanitizeSearchParams', () => {
    it('should return sanitized value of location.search if it is without encoding)', () => {
      const search =
        'url=https://github.com/test-samples&state=9284564475&session=98765&session_state=45645654567&code=9844646765&storageType=persistent&new';

      const searchParams = new URLSearchParams(search);
      const sanitizedSearchParams = sanitizeSearchParams(searchParams);

      expect(sanitizedSearchParams.toString()).toEqual(
        'url=https%3A%2F%2Fgithub.com%2Ftest-samples&storageType=persistent&new=',
      );
    });

    it('should return sanitized value of location.search if it is encoded', () => {
      const search =
        'url=https%3A%2F%2Fgithub.com%2Ftest-samples%26state%3D9284564475%26session%3D98765%26session_state%3D45645654567%26code%3D9844646765%26storageType%3Dpersistent';

      const searchParams = new URLSearchParams(search);
      const sanitizedSearchParams = sanitizeSearchParams(searchParams);

      expect(sanitizedSearchParams.toString()).toEqual(
        'url=https%3A%2F%2Fgithub.com%2Ftest-samples%26storageType%3Dpersistent',
      );
    });
  });

  describe('sanitizePathname', () => {
    it('should remove oauth redirect leftovers', () => {
      const pathname =
        '/f&code=12345&session=67890&session_state=13579&state=24680';

      const newPathname = sanitizePathname(pathname);

      expect(newPathname).toEqual('/f');
    });
  });
});
