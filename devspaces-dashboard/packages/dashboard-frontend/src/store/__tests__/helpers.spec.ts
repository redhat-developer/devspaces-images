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

import { createObject } from '@/store/helpers';

describe('Store helpers', () => {
  describe('Creates a new state object', () => {
    it('should copy all enumerable own properties from two source objects to a new one', () => {
      const source = { a: [1], b: [2, 3] };
      const newSource = { b: [3], c: [4] };

      const target = createObject(source, newSource);

      expect(source).toEqual({ a: [1], b: [2, 3] });
      expect(newSource).toEqual({ b: [3], c: [4] });
      expect(target).toEqual({ a: [1], b: [3], c: [4] });
    });
  });
});
