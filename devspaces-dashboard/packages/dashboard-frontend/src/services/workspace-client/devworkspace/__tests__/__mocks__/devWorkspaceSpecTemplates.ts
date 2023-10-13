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

const getDevWorkspaceTemplate = (cpuLimit = '1500m') =>
  ({
    apiVersion: 'workspace.devfile.io/v1alpha2',
    kind: 'DevWorkspaceTemplate',
    metadata: {
      annotations: {
        'che.eclipse.org/components-update-policy': 'managed',
        'che.eclipse.org/plugin-registry-url':
          'https://192.168.64.24.nip.io/plugin-registry/v3/plugins/eclipse/che-theia/next/devfile.yaml',
      },
      creationTimestamp: '2021-11-24T17:11:37Z',
      generation: 1,
      name: 'theia-ide-workspacee2ade80d625b4f3e',
      namespace: 'admin-che',
      resourceVersion: '3766',
      uid: '106c3fa1-32c6-47ef-87e5-333de6914837',
    },
    spec: {
      commands: [],
      components: [
        {
          attributes: {
            'app.kubernetes.io/component': 'che-theia',
            'app.kubernetes.io/part-of': 'che-theia.eclipse.org',
          },
          container: {
            cpuLimit,
            cpuRequest: '100m',
            endpoints: [],
            env: [
              {
                name: 'CHE_DASHBOARD_URL',
                value: 'http://localhost',
              },
              {
                name: 'CHE_PLUGIN_REGISTRY_URL',
                value: 'plugin-registry-url',
              },
              {
                name: 'CHE_PLUGIN_REGISTRY_INTERNAL_URL',
                value: 'plugin-registry-internal-url',
              },
            ],
            image: 'quay.io/eclipse/che-theia:next',
            memoryLimit: '512M',
            mountSources: true,
            sourceMapping: '/projects',
            volumeMounts: [],
          },
          name: 'theia-ide',
        },
        {
          name: 'plugins',
          volume: {},
        },
        {
          name: 'theia-local',
          volume: {},
        },
        {
          attributes: {
            'app.kubernetes.io/component': 'machine-exec',
            'app.kubernetes.io/part-of': 'che-theia.eclipse.org',
          },
          container: {
            command: ['/go/bin/che-machine-exec', '--url', '127.0.0.1:3333'],
            cpuLimit: '500m',
            cpuRequest: '30m',
            env: [
              {
                name: 'CHE_DASHBOARD_URL',
                value: 'http://localhost',
              },
              {
                name: 'CHE_PLUGIN_REGISTRY_URL',
                value: 'plugin-registry-url',
              },
              {
                name: 'CHE_PLUGIN_REGISTRY_INTERNAL_URL',
                value: 'plugin-registry-internal-url',
              },
            ],
            image: 'quay.io/eclipse/che-machine-exec:next',
            memoryLimit: '128Mi',
            memoryRequest: '32Mi',
            sourceMapping: '/projects',
          },
          name: 'che-machine-exec',
        },
        {
          attributes: {
            'app.kubernetes.io/component': 'remote-runtime-injector',
            'app.kubernetes.io/part-of': 'che-theia.eclipse.org',
          },
          container: {
            cpuLimit: '500m',
            cpuRequest: '30m',
            env: [
              {
                name: 'CHE_DASHBOARD_URL',
                value: 'http://localhost',
              },
              {
                name: 'CHE_PLUGIN_REGISTRY_URL',
                value: 'plugin-registry-url',
              },
              {
                name: 'CHE_PLUGIN_REGISTRY_INTERNAL_URL',
                value: 'plugin-registry-internal-url',
              },
            ],
            image: 'quay.io/eclipse/che-theia-endpoint-runtime-binary:next',
            memoryLimit: '128Mi',
            memoryRequest: '32Mi',
            sourceMapping: '/projects',
            volumeMounts: [
              {
                name: 'plugins',
                path: '/plugins',
              },
              {
                name: 'remote-endpoint',
                path: '/remote-endpoint',
              },
            ],
          },
          name: 'remote-runtime-injector',
        },
        {
          name: 'remote-endpoint',
          volume: {
            ephemeral: true,
          },
        },
      ],
      events: {
        preStart: ['init-container-command'],
      },
    },
  }) as any;

export default getDevWorkspaceTemplate;
