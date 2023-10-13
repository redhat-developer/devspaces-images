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
  configureProjectRemotes,
  getGitRemotes,
  GitRemote,
  sanitizeValue,
} from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/getGitRemotes';
import devfileApi from '@/services/devfileApi';

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

  describe('configureProjectRemotes()', () => {
    let dashboardDevfile: devfileApi.Devfile;

    beforeEach(() => {
      dashboardDevfile = {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'new-project',
          namespace: 'user-che',
        },
        projects: [
          {
            name: 'dashboard',
            git: {
              remotes: {
                origin: 'https://github.com/user/che-dashboard.git',
              },
            },
          },
        ],
      };
    });

    test('remotes configured with urls', () => {
      const remotes = '{http://git-test-1.git,http://git-test-2.git,http://git-test-3.git}';
      configureProjectRemotes(dashboardDevfile, remotes, false);

      expect(dashboardDevfile.projects).not.toBe(undefined);
      expect(dashboardDevfile.projects?.length).toBe(1);
      expect(dashboardDevfile.projects?.[0]).toMatchObject({
        git: {
          checkoutFrom: {
            remote: 'origin',
          },
          remotes: {
            origin: 'http://git-test-1.git',
            upstream: 'http://git-test-2.git',
            fork1: 'http://git-test-3.git',
          },
        },
      });
    });

    test('remotes configured with urls and names', () => {
      const remotes =
        '{{test1,http://git-test-1.git},{test2,http://git-test-2.git},{test3,http://git-test-3.git}}';
      configureProjectRemotes(dashboardDevfile, remotes, false);

      expect(dashboardDevfile.projects).not.toBe(undefined);
      expect(dashboardDevfile.projects?.length).toBe(1);
      expect(dashboardDevfile.projects?.[0]).toMatchObject({
        git: {
          checkoutFrom: {
            remote: 'origin',
          },
          remotes: {
            origin: 'https://github.com/user/che-dashboard.git',
            test1: 'http://git-test-1.git',
            test2: 'http://git-test-2.git',
            test3: 'http://git-test-3.git',
          },
        },
      });
    });

    test('keep origin remote if origin remote not provided as a parameter', () => {
      const remotes =
        '{{upstream,https://github.com/eclipse-che/che-dashboard.git},{fork,https://github.com/fork/che-dashboard.git}}';
      configureProjectRemotes(dashboardDevfile, remotes, false);

      expect(dashboardDevfile.projects).not.toBe(undefined);
      expect(dashboardDevfile.projects?.length).toBe(1);
      expect(dashboardDevfile.projects?.[0]).toMatchObject({
        git: {
          checkoutFrom: {
            remote: 'origin',
          },
          remotes: {
            origin: 'https://github.com/user/che-dashboard.git',
            upstream: 'https://github.com/eclipse-che/che-dashboard.git',
            fork: 'https://github.com/fork/che-dashboard.git',
          },
        },
      });
    });

    test('keep origin remote and branch if origin remote not provided as a parameter', () => {
      dashboardDevfile.projects = [
        {
          name: 'dashboard',
          git: {
            checkoutFrom: {
              revision: 'branch',
            },
            remotes: {
              origin: 'https://github.com/user/che-dashboard.git',
            },
          },
        },
      ];
      const remotes =
        '{{upstream,https://github.com/eclipse-che/che-dashboard.git},{fork,https://github.com/fork/che-dashboard.git}}';
      configureProjectRemotes(dashboardDevfile, remotes, false);

      expect(dashboardDevfile.projects).not.toBe(undefined);
      expect(dashboardDevfile.projects?.length).toBe(1);
      expect(dashboardDevfile.projects?.[0]).toMatchObject({
        git: {
          checkoutFrom: {
            remote: 'origin',
            revision: 'branch',
          },
          remotes: {
            origin: 'https://github.com/user/che-dashboard.git',
            upstream: 'https://github.com/eclipse-che/che-dashboard.git',
            fork: 'https://github.com/fork/che-dashboard.git',
          },
        },
      });
    });

    test('use new origin remote if provided as a parameter', () => {
      const remotes =
        '{{origin,https://github.com/other-user/che-dashboard.git},{upstream,https://github.com/eclipse-che/che-dashboard.git},{fork,https://github.com/fork/che-dashboard.git}}';
      configureProjectRemotes(dashboardDevfile, remotes, false);

      expect(dashboardDevfile.projects).not.toBe(undefined);
      expect(dashboardDevfile.projects?.length).toBe(1);
      expect(dashboardDevfile.projects?.[0]).toMatchObject({
        git: {
          checkoutFrom: {
            remote: 'origin',
          },
          remotes: {
            origin: 'https://github.com/other-user/che-dashboard.git',
            upstream: 'https://github.com/eclipse-che/che-dashboard.git',
            fork: 'https://github.com/fork/che-dashboard.git',
          },
        },
      });
    });

    test('use default devfile when there is no project url, but remotes exist', () => {
      const defaultDevfile = {
        schemaVersion: '2.1.0',
        metadata: {
          generateName: 'empty',
        },
      } as devfileApi.Devfile;
      const remotes = '{https://github.com/eclipse-che/che-dashboard.git}';
      configureProjectRemotes(defaultDevfile, remotes, true);

      const expectedDevfile = {
        schemaVersion: '2.1.0',
        metadata: {
          generateName: 'che-dashboard',
          name: 'che-dashboard',
        },
        projects: [
          {
            git: {
              checkoutFrom: { remote: 'origin' },
              remotes: {
                origin: 'https://github.com/eclipse-che/che-dashboard.git',
              },
            },
            name: 'che-dashboard',
          },
        ],
      };
      expect(defaultDevfile).toStrictEqual(expectedDevfile);
    });
  });
});
