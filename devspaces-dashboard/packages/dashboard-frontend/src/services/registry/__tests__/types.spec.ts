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

import { isDevfileMetaData } from '../types';

describe('api.webSocket typeguards', () => {
  test('isWebSocketUnsubscribeParams', () => {
    expect(
      isDevfileMetaData({
        displayName: 'Display Name',
        icon: 'http://test.link',
        links: {},
        tags: [],
      }),
    ).toBeTruthy();

    expect(isDevfileMetaData(undefined)).toBeFalsy();
    expect(isDevfileMetaData('foo')).toBeFalsy();
    expect(isDevfileMetaData({ foo: 'bar' })).toBeFalsy();
  });
});
