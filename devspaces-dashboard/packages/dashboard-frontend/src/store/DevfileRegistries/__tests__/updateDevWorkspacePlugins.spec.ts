/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import updateDevWorkspacePlugins from '../updateDevWorkspacePlugins';
import devfileApi from '../../../services/devfileApi';

describe('Update DevWorkspace Plugins', () => {
  it('Should move devWorkspace plugins from components to contributions', () => {
    const devWorkspace = {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'DevWorkspace',
      metadata: {
        name: 'apache-camel-k',
      },
      spec: {
        template: {
          components: [
            {
              name: 'tools',
              container: {
                image: 'quay.io/devfile/universal-developer-image:ubi8',
              },
            },
            {
              name: 'theia-ide-apache-camel-k',
              plugin: {
                kubernetes: {
                  name: 'theia-ide-apache-camel-k',
                },
              },
            },
          ],
        },
      },
    } as devfileApi.DevWorkspace;

    updateDevWorkspacePlugins(devWorkspace);

    expect(devWorkspace).toEqual({
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'DevWorkspace',
      metadata: {
        name: 'apache-camel-k',
      },
      spec: {
        contributions: [
          {
            name: 'theia-ide-apache-camel-k',
            kubernetes: {
              name: 'theia-ide-apache-camel-k',
            },
          },
        ],
        template: {
          components: [
            {
              name: 'tools',
              container: {
                image: 'quay.io/devfile/universal-developer-image:ubi8',
              },
            },
          ],
        },
      },
    });
  });

  it('Should leave devWorkspace without changes if it doesn`t have plugins in components', () => {
    const devWorkspace = {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'DevWorkspace',
      metadata: {
        name: 'apache-camel-k',
      },
      spec: {
        contributions: [
          {
            name: 'theia-ide-apache-camel-k',
            kubernetes: {
              name: 'theia-ide-apache-camel-k',
            },
          },
        ],
        template: {
          components: [
            {
              name: 'tools',
              container: {
                image: 'quay.io/devfile/universal-developer-image:ubi8',
              },
            },
          ],
        },
      },
    } as devfileApi.DevWorkspace;

    updateDevWorkspacePlugins(devWorkspace);

    expect(devWorkspace).toEqual({
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'DevWorkspace',
      metadata: {
        name: 'apache-camel-k',
      },
      spec: {
        contributions: [
          {
            name: 'theia-ide-apache-camel-k',
            kubernetes: {
              name: 'theia-ide-apache-camel-k',
            },
          },
        ],
        template: {
          components: [
            {
              name: 'tools',
              container: {
                image: 'quay.io/devfile/universal-developer-image:ubi8',
              },
            },
          ],
        },
      },
    });
  });
});
