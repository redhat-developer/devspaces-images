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

export const template = {
  apiVersion: 'workspace.devfile.io/v1alpha2',
  kind: 'DevWorkspaceTemplate',
  metadata: {
    name: 'che-theia-vsix-installer-workspace2d071d95b33a4835',
    namespace: 'admin-che',
    ownerReferences: [
      {
        apiVersion: 'workspace.devfile.io/v1alpha2',
        kind: 'devworkspace',
        name: 'spring-petclinic-oqo7',
        uid: '2d071d95-b33a-4835-9f66-5e1f3a42d7b8'
      }
    ]
  },
  spec: {
    components: [
      {
        name: 'vsix-installer',
        attributes: {
          'app.kubernetes.io/part-of': 'che-theia.eclipse.org',
          'app.kubernetes.io/component': 'vsix-installer'
        },
        container: {
          image: 'quay.io/eclipse/che-theia-vsix-installer:next',
          volumeMounts: [
            {
              path: '/plugins',
              name: 'plugins'
            }
          ],
          env: [
            {
              name: 'CHE_DASHBOARD_URL',
              value: 'https://192.168.64.5.nip.io'
            },
            {
              name: 'CHE_PLUGIN_REGISTRY_URL',
              value: 'https://192.168.64.5.nip.io/plugin-registry/v3'
            }
          ]
        }
      }
    ],
    events: {
      preStart: ['copy-vsix']
    },
    commands: [
      {
        id: 'copy-vsix',
        apply: {
          component: 'vsix-installer'
        }
      }
    ]
  }
};
