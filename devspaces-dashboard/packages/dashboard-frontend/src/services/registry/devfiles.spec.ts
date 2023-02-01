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

import { resolveLinks, updateObjectLinks } from './devfiles';

describe('devfile links', () => {
  const baseUrl = 'http://this.is.my.base.url';

  it('should update links that are not absolute', () => {
    const metadata = {
      displayName: 'nodejs-react',
      icon: '/icon.png',
      tags: [],
      links: {
        v2: 'https://github.com/che-samples/nodejs-react-redux/tree/devfilev2',
        self: '/devfiles/nodejs-react/devfile.yaml',
        devWorkspaces: {
          'eclipse/che-theia/latest': '/devfiles/nodejs-react/devworkspace-che-theia-latest.yaml',
          'eclipse/che-theia/next': '/devfiles/nodejs-react/devworkspace-che-theia-next.yaml',
        },
      },
    } as che.DevfileMetaData;

    const resolved = resolveLinks(metadata, baseUrl);
    // this one is not updated as already absolute
    expect(resolved.v2).toBe('https://github.com/che-samples/nodejs-react-redux/tree/devfilev2');
    expect(resolved.self).toBe(`${baseUrl}/devfiles/nodejs-react/devfile.yaml`);
    expect(resolved.devWorkspaces['eclipse/che-theia/latest']).toBe(
      `${baseUrl}/devfiles/nodejs-react/devworkspace-che-theia-latest.yaml`,
    );
    expect(resolved.devWorkspaces['eclipse/che-theia/next']).toBe(
      `${baseUrl}/devfiles/nodejs-react/devworkspace-che-theia-next.yaml`,
    );
  });

  it('should update links', () => {
    const object = '/devfile/foo.yaml';
    const updated = updateObjectLinks(object, baseUrl);

    expect(updated).toBe(`${baseUrl}/devfile/foo.yaml`);
  });

  it('should not update absolute link', () => {
    const object = 'http://asbolute.link';
    const updated = updateObjectLinks(object, baseUrl);

    // this one is not updated as already absolute
    expect(updated).toBe('http://asbolute.link');
  });

  it('should update complex objects', () => {
    const object = {
      link1: '/devfile/foo.yaml',
      links: {
        link2: '/devfile/bar.yaml',
      },
      otherLinks: {
        subLinks: {
          subSubLinks: {
            link3: '/devfile/baz.yaml',
          },
        },
      },
    };
    const updated = updateObjectLinks(object, baseUrl);

    // updating all links
    expect(updated.link1).toBe(`${baseUrl}/devfile/foo.yaml`);
    expect(updated.links.link2).toBe(`${baseUrl}/devfile/bar.yaml`);
    expect(updated.otherLinks.subLinks.subSubLinks.link3).toBe(`${baseUrl}/devfile/baz.yaml`);
  });
});
