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

import { getProjectFromUrl } from '../getProjectFromUrl';

describe('FactoryLoaderContainer/getProjectFromUrl', () => {
  test('Get a project from the URL which does not include "*/tree/*" and "*.git"', () => {
    const url = 'https://github.com/test/rest-repo';

    const project = getProjectFromUrl(url);

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

    const project = getProjectFromUrl(url);

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

    const project = getProjectFromUrl(url);

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
