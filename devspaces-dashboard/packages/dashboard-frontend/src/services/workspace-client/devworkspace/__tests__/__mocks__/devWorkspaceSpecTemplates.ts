/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import devfileApi from '@/services/devfileApi';

const getVSCodeDevWorkspaceTemplate = (cpuLimit = '1500m'): devfileApi.DevWorkspaceTemplate => {
  return {
    apiVersion: 'workspace.devfile.io/v1alpha2',
    kind: 'DevWorkspaceTemplate',
    metadata: {
      annotations: {
        'che.eclipse.org/components-update-policy': 'managed',
        'che.eclipse.org/plugin-registry-url': 'che-incubator/che-code/latest',
      },
      creationTimestamp: new Date('2024-05-30T12:51:45Z'),
      generation: 1,
      name: 'che-code-empty-mm9t',
      namespace: 'admin-che',
      ownerReferences: [
        {
          apiVersion: 'workspace.devfile.io/v1alpha2',
          kind: 'devworkspace',
          name: 'empty-mm9t',
          uid: 'ca85c4f7-d36d-4f4a-8ce9-b8cf72aa8a37',
        },
      ],
      resourceVersion: '7429',
      uid: 'e4781884-a294-4719-966a-4a4dfce3b7ff',
    },
    spec: {
      attributes: {
        version: null,
      },
      commands: [
        {
          apply: {
            component: 'che-code-injector',
          },
          id: 'init-container-command',
        },
        {
          exec: {
            commandLine:
              'nohup /checode/entrypoint-volume.sh > /checode/entrypoint-logs.txt 2>&1 &',
            component: 'che-code-runtime-description',
          },
          id: 'init-che-code-command',
        },
      ],
      components: [
        {
          container: {
            command: ['/entrypoint-init-container.sh'],
            cpuLimit,
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
            image: 'quay.io/che-incubator/che-code:latest',
            memoryLimit: '256Mi',
            memoryRequest: '32Mi',
            sourceMapping: '/projects',
            volumeMounts: [
              {
                name: 'checode',
                path: '/checode',
              },
            ],
          },
          name: 'che-code-injector',
        },
        {
          attributes: {
            'app.kubernetes.io/component': 'che-code-runtime',
            'app.kubernetes.io/part-of': 'che-code.eclipse.org',
            'controller.devfile.io/container-contribution': true,
          },
          container: {
            cpuLimit: '500m',
            cpuRequest: '30m',
            endpoints: [
              {
                attributes: {
                  cookiesAuthEnabled: true,
                  discoverable: false,
                  type: 'main',
                  urlRewriteSupported: true,
                },
                exposure: 'public',
                name: 'che-code',
                protocol: 'https',
                secure: true,
                targetPort: 3100,
              },
              {
                attributes: {
                  discoverable: false,
                  urlRewriteSupported: false,
                },
                exposure: 'public',
                name: 'code-redirect-1',
                protocol: 'https',
                targetPort: 13131,
              },
              {
                attributes: {
                  discoverable: false,
                  urlRewriteSupported: false,
                },
                exposure: 'public',
                name: 'code-redirect-2',
                protocol: 'https',
                targetPort: 13132,
              },
              {
                attributes: {
                  discoverable: false,
                  urlRewriteSupported: false,
                },
                exposure: 'public',
                name: 'code-redirect-3',
                protocol: 'https',
                targetPort: 13133,
              },
            ],
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
            image: 'quay.io/devfile/universal-developer-image:latest',
            memoryLimit: '1024Mi',
            memoryRequest: '256Mi',
            sourceMapping: '/projects',
            volumeMounts: [
              {
                name: 'checode',
                path: '/checode',
              },
            ],
          },
          name: 'che-code-runtime-description',
        },
        {
          name: 'checode',
          volume: {},
        },
      ],
      events: {
        postStart: ['init-che-code-command'],
        preStart: ['init-container-command'],
      },
    },
  };
};

export default getVSCodeDevWorkspaceTemplate;
