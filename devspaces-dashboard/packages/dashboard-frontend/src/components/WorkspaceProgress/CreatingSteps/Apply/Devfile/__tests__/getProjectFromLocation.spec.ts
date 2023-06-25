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

import { getProjectFromLocation } from '../getProjectFromLocation';
import common from '@eclipse-che/common';

describe('FactoryLoaderContainer/getProjectFromLocation', () => {
  describe('unsupported location', () => {
    test('Get a project from the unsupported location', () => {
      const unsupportedLocation = 'github.com/che-incubator/devfile-converter';

      let errorMessage: string | undefined;
      try {
        getProjectFromLocation(unsupportedLocation);
      } catch (err) {
        errorMessage = common.helpers.errors.getMessage(err);
      }

      expect(errorMessage).toEqual(
        "Failed to get project from location: 'github.com/che-incubator/devfile-converter'.",
      );
    });
  });
  describe('SSH location', () => {
    test('Get a project from the SSH location', () => {
      const location = 'git@github.com:eclipse-che/che-devfile-registry.git';

      const project = getProjectFromLocation(location);

      expect(project).toEqual({
        git: {
          remotes: {
            origin: 'git@github.com:eclipse-che/che-devfile-registry.git',
          },
        },
        name: 'che-devfile-registry',
      });
    });
  });

  describe('Full path URL', () => {
    test('Get a project from the URL which does not include "*/tree/*" and "*.git"', () => {
      const url = 'https://github.com/test/rest-repo';

      const project = getProjectFromLocation(url);

      expect(project).toEqual({
        git: {
          remotes: {
            origin: 'https://github.com/test/rest-repo.git',
          },
        },
        name: 'rest-repo',
      });
    });

    test('Get a project from the URL which ends with ".git"', () => {
      const url = 'https://github.com/test/rest-repo.git';

      const project = getProjectFromLocation(url);

      expect(project).toEqual({
        git: {
          remotes: {
            origin: 'https://github.com/test/rest-repo.git',
          },
        },
        name: 'rest-repo',
      });
    });

    test('Get a project from the URL which includs "*/tree/*"', () => {
      const url = 'https://github.com/test/rest-repo/tree/a4f1949c33ddab5f66c19c27a844af1c46aa0820';

      const project = getProjectFromLocation(url);

      expect(project).toEqual({
        git: {
          checkoutFrom: {
            revision: 'a4f1949c33ddab5f66c19c27a844af1c46aa0820',
          },
          remotes: {
            origin: 'https://github.com/test/rest-repo.git',
          },
        },
        name: 'a4f1949c33ddab5f66c19c27a844af1c46aa0820',
      });
    });
  });
});
