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

import { getGitRemotes, GitRemote, sanitizeValue } from '../getGitRemotes';

describe('getGitRemotes functions', () => {
  describe('getGitRemotes()', () => {
    it('should return remotes when one remote is provided', () => {
      const input = '{https://github.com/test1/che-dashboard}';
      const expected: GitRemote[] = [
        { name: 'origin', url: 'https://github.com/test1/che-dashboard' },
      ];
      expect(getGitRemotes(input)).toMatchObject(expected);
    });
    it('should return remotes when two remotes are provided', () => {
      const input =
        '{https://github.com/test1/che-dashboard, https://github.com/test2/che-dashboard}';
      const expected: GitRemote[] = [
        { name: 'origin', url: 'https://github.com/test1/che-dashboard' },
        { name: 'upstream', url: 'https://github.com/test2/che-dashboard' },
      ];
      expect(getGitRemotes(input)).toMatchObject(expected);
    });

    it('should return remotes when three remotes are provided', () => {
      const input =
        '{https://github.com/test1/che-dashboard, https://github.com/test2/che-dashboard, https://github.com/test3/che-dashboard}';
      const expected: GitRemote[] = [
        { name: 'origin', url: 'https://github.com/test1/che-dashboard' },
        { name: 'upstream', url: 'https://github.com/test2/che-dashboard' },
        { name: 'fork1', url: 'https://github.com/test3/che-dashboard' },
      ];
      expect(getGitRemotes(input)).toMatchObject(expected);
    });

    it('should return remotes when two remotes with names are provided', () => {
      const input =
        '{{test1,https://github.com/test1/che-dashboard},{test2,https://github.com/test2/che-dashboard}}';
      const expected: GitRemote[] = [
        { name: 'test1', url: 'https://github.com/test1/che-dashboard' },
        { name: 'test2', url: 'https://github.com/test2/che-dashboard' },
      ];
      expect(getGitRemotes(input)).toMatchObject(expected);
    });

    it('should return remotes when one remote with name is provided', () => {
      const input = '{{test1,https://github.com/test1/che-dashboard}}';
      const expected: GitRemote[] = [
        { name: 'test1', url: 'https://github.com/test1/che-dashboard' },
      ];
      expect(getGitRemotes(input)).toMatchObject(expected);
    });

    it('should return remotes when multiple remotes with names are provided', () => {
      const input =
        '{{test1,https://github.com/test1/che-dashboard},{test2,https://github.com/test2/che-dashboard},{test3,https://github.com/test3/che-dashboard},{test4,https://github.com/test4/che-dashboard}}';
      const expected: GitRemote[] = [
        { name: 'test1', url: 'https://github.com/test1/che-dashboard' },
        { name: 'test2', url: 'https://github.com/test2/che-dashboard' },
        { name: 'test3', url: 'https://github.com/test3/che-dashboard' },
        { name: 'test4', url: 'https://github.com/test4/che-dashboard' },
      ];
      expect(getGitRemotes(input)).toMatchObject(expected);
    });

    it('should throw error when cannot parse remotes input', () => {
      const input =
        '{{https://github.com/test1/che-dashboard,https://github.com/test2/che-dashboard}';
      expect(() => {
        getGitRemotes(input);
      }).toThrow();
    });
  });

  describe('sanitizeValue()', () => {
    it('should remove all whitespaces', () => {
      const input =
        '[ https://github.com/test1/che-dashboard, https://github.com/test2/che-dashboard   ] ';
      const expected =
        '["https://github.com/test1/che-dashboard","https://github.com/test2/che-dashboard"]';
      expect(sanitizeValue(input)).toBe(expected);
    });
    it('should convert left braces', () => {
      const input =
        '{{test,https://github.com/test1/che-dashboard],{test2,https://github.com/test2/che-dashboard]]';
      const expected =
        '[["test","https://github.com/test1/che-dashboard"],["test2","https://github.com/test2/che-dashboard"]]';
      expect(sanitizeValue(input)).toBe(expected);
    });
    it('should convert right braces', () => {
      const input =
        '[[test,https://github.com/test1/che-dashboard},[test2,https://github.com/test2/che-dashboard}}';
      const expected =
        '[["test","https://github.com/test1/che-dashboard"],["test2","https://github.com/test2/che-dashboard"]]';
      expect(sanitizeValue(input)).toBe(expected);
    });
    it('should add quotations beside left square brackets', () => {
      const input =
        '[[test","https://github.com/test1/che-dashboard"],[test2","https://github.com/test2/che-dashboard"]]';
      const expected =
        '[["test","https://github.com/test1/che-dashboard"],["test2","https://github.com/test2/che-dashboard"]]';
      expect(sanitizeValue(input)).toBe(expected);
    });
    it('should add quotations beside right square brackets', () => {
      const input =
        '[["test","https://github.com/test1/che-dashboard],["test2","https://github.com/test2/che-dashboard]]';
      const expected =
        '[["test","https://github.com/test1/che-dashboard"],["test2","https://github.com/test2/che-dashboard"]]';
      expect(sanitizeValue(input)).toBe(expected);
    });
    it('should add quotations when in between two strings', () => {
      const input =
        '[["test,https://github.com/test1/che-dashboard"],["test2,https://github.com/test2/che-dashboard"]]';
      const expected =
        '[["test","https://github.com/test1/che-dashboard"],["test2","https://github.com/test2/che-dashboard"]]';
      expect(sanitizeValue(input)).toBe(expected);
    });
  });
});
