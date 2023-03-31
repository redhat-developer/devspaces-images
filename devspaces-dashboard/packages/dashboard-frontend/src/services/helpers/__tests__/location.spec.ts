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

import { sanitizeLocation } from '../location';
import { Location } from 'history';

describe('location/sanitizeLocation', () => {
  it("should return the same values if location variables don't have OAuth params included", () => {
    const search = '?url=https%3A%2F%2Fgithub.com%2Ftest-samples&storageType=persistent';
    const pathname = '/f';

    const newLocation = sanitizeLocation({ search, pathname } as Location);

    expect(newLocation.search).toEqual(search);
    expect(newLocation.pathname).toEqual(pathname);
  });

  it('should return sanitized value of location.search if it is without encoding)', () => {
    const search =
      '?url=https://github.com/test-samples&state=9284564475&session=98765&session_state=45645654567&code=9844646765&storageType=persistent';
    const pathname = '/f';

    const newLocation = sanitizeLocation({ search, pathname } as Location);

    expect(newLocation.search).not.toEqual(search);
    expect(newLocation.search).toEqual(
      '?url=https%3A%2F%2Fgithub.com%2Ftest-samples&storageType=persistent',
    );
    expect(newLocation.pathname).toEqual(pathname);
  });

  it('should return sanitized value of location.search if it is encoded', () => {
    const search =
      '?url=https%3A%2F%2Fgithub.com%2Ftest-samples%26state%3D9284564475%26session%3D98765%26session_state%3D45645654567%26code%3D9844646765%26storageType%3Dpersistent';
    const pathname = '/f';

    const newLocation = sanitizeLocation({ search, pathname } as Location);

    expect(newLocation.search).not.toEqual(search);
    expect(newLocation.search).toEqual(
      '?url=https%3A%2F%2Fgithub.com%2Ftest-samples%26storageType%3Dpersistent',
    );
    expect(newLocation.pathname).toEqual(pathname);
  });

  it('should return sanitized value of location.pathname', () => {
    const search = '?url=https%3A%2F%2Fgithub.com%2Ftest-samples';
    const pathname = '/f&code=1239844646765';

    const newLocation = sanitizeLocation({ search, pathname } as Location);

    expect(newLocation.search).toEqual(search);
    expect(newLocation.pathname).not.toEqual(pathname);
    expect(newLocation.pathname).toEqual('/f');
  });
});
