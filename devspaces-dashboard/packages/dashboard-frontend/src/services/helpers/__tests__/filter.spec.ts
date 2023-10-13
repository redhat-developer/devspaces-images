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

import match from '@/services/helpers/filter';

describe('filter/match', () => {
  const value = 'Lorem ipsum dolor sit amet';

  it('should match if starts with token value', () => {
    const filterTokenToMatch = 'lor';

    const result = match(value, filterTokenToMatch);
    expect(result).toBe(true);
  });

  it('should match if a word in the middle starts with token value', () => {
    const filterTokenToMatch = 'ips';

    const result = match(value, filterTokenToMatch);
    expect(result).toBe(true);
  });

  it('should match if a word in the middle starts with token value #2', () => {
    const value = 'Lorem-ipsum-dolor-sit-amet';
    const filterTokenToMatch = 'ipsum';

    const result = match(value, filterTokenToMatch);
    expect(result).toBe(true);
  });

  it('should match if all tokens match words', () => {
    const filterTokenToMatch = 'lorem amet';

    const result = match(value, filterTokenToMatch);
    expect(result).toBe(true);
  });

  it('should not match if no words start with token', () => {
    const filterTokenNotToMatch = 'value';

    const result = match(value, filterTokenNotToMatch);
    expect(result).toBe(false);
  });

  it('should not match if some of tokens not match words', () => {
    const filterTokenNotToMatch = 'lorem dolore';

    const result = match(value, filterTokenNotToMatch);
    expect(result).toBe(false);
  });
});
