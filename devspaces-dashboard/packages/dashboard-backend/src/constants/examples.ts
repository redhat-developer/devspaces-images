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

import { dump } from 'js-yaml';

export const dockerConfigExample = {
  get dockerconfig() {
    const registry = 'https://index.docker.io/v1/';
    const username = 'janedoe';
    const password = 'xxxxxxxxxxxxxxxxxxxxxxx';
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    return Buffer.from(
      JSON.stringify({
        auths: {
          [registry]: {
            username,
            password,
            auth,
          },
        },
      }),
    ).toString('base64');
  },
};

export const dataResolverSchemaExample = {
  get url() {
    return 'http://127.0.0.1:8080/dashboard/devfile-registry/devfiles/index.json';
  },
};

export const devWorkspaceResourcesExample = {
  get devfileContent() {
    const devfile = {
      schemaVersion: '2.1.0',
      metadata: {
        name: 'wksp-test',
      },
      components: [
        {
          container: {
            image: 'quay.io/devfile/universal-developer-image:latest',
            sourceMapping: '/projects',
          },
          name: 'universal-developer-image',
        },
      ],
    };

    return dump(devfile, { indent: 2 });
  },
  get editorContent() {
    const devfile = {
      schemaVersion: '2.2.2',
      metadata: {
        description:
          'Microsoft Visual Studio Code - Open Source IDE for Eclipse Che - Insiders build',
        displayName: 'VS Code - Open Source',
        name: 'che-code',
        tags: ['Tech-Preview'],
        attributes: {
          title: 'VS Code - Open Source',
        },
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
            image: 'quay.io/che-incubator/che-code:insiders',
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
            ],
            image: 'quay.io/devfile/universal-developer-image:latest',
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
    };

    return dump(devfile, { indent: 2 });
  },
};
