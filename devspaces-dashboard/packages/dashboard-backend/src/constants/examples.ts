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
  editorId: 'che-incubator/che-code/insiders',
  pluginRegistryUrl: 'http://plugin-registry.eclipse-che.svc:8080/v3',
  projects: [],
};
