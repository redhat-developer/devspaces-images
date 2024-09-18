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

import { isSourceAllowed } from '@/store/ServerConfig/helpers';

describe('helpers', () => {
  describe('isAllowedSourceUrl', () => {
    test('allowed urls', () => {
      expect(isSourceAllowed(['https://a/*'], 'https://a/b/c')).toBe(true);
      expect(isSourceAllowed(['https://a/*/c'], 'https://a/b/c')).toBe(true);
      expect(isSourceAllowed(['https://a/b/c'], 'https://a/b/c')).toBe(true);
      expect(isSourceAllowed(['*'], 'https://a/b/c/')).toBe(true);
      expect(isSourceAllowed(undefined, 'https://a/b/c')).toBe(true);
      expect(isSourceAllowed([], 'https://a/b/c')).toBe(true);
    });

    test('disallowed urls', () => {
      expect(isSourceAllowed(['https://a'], 'https://a/b/c/')).toBe(false);
    });
  });
});
