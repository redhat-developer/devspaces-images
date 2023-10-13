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

import devfileApi from '@/services/devfileApi';
import { FactoryResolver } from '@/services/helpers/types';
import normalizeDevfileV2 from '@/store/FactoryResolver/normalizeDevfileV2';

export const FACTORY_RESOLVER_DELAY = 600;
export const DEVWORKSPACE_RESOURSES_DELAY = 600;
export const CREATE_DEVWORKSPACE_DELAY = 200;
export const CREATE_DEVWORKSPACETEMPLATE_DELAY = 200;
export const PATCH_DEVWORKSPACE_DELAY = 100;

export const TIME_LIMIT = 2500;

// mock objects
export const timestampNew = '2023-09-04T14:09:42.560Z';
export const namespace = { name: 'user-che', attributes: { phase: 'Active' } };
export const url = 'https://github.com/eclipse-che/che-dashboard';
export const devfile = {
  schemaVersion: '2.2.0',
  metadata: {
    name: 'che-dashboard',
    namespace: namespace.name,
  },
  components: [
    {
      name: 'universal-developer-image',
      container: {
        image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
      },
    },
  ],
  commands: [],
};
export const factoryResolver: FactoryResolver = {
  v: '4.0',
  source: 'devfile.yaml',
  scm_info: {
    clone_url: 'https://github.com/eclipse-che/che-dashboard.git',
    scm_provider: 'github',
  },
  devfile: devfile,
  links: [],
};
export const devfileV2 = normalizeDevfileV2(
  devfile as devfileApi.DevfileLike,
  factoryResolver,
  'https://github.com/eclipse-che/che-dashboard',
  [],
  namespace.name,
  { factoryUrl: url },
);
const sampleResourceUrl =
  'http://localhost/plugin-registry/v3/plugins/che-incubator/che-code/insiders/devfile.yaml';
export const plugins = {
  [sampleResourceUrl]: {
    url: sampleResourceUrl,
    plugin: {
      schemaVersion: '2.2.0',
      metadata: {
        name: 'che-code',
      },
    } as devfileApi.Devfile,
  },
};
export const devfileContent = dump({
  schemaVersion: '2.2.0',
  metadata: {
    name: 'che-dashboard',
    namespace: namespace.name,
  },
  components: [
    {
      name: 'universal-developer-image',
      container: {
        image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
      },
    },
  ],
  commands: [],
  projects: [
    {
      name: 'che-dashboard',
      git: {
        remotes: {
          origin: 'https://github.com/eclipse-che/che-dashboard.git',
        },
      },
    },
  ],
  attributes: {
    'dw.metadata.annotations': {
      'che.eclipse.org/devfile-source': dump({
        scm: {
          repo: 'https://github.com/eclipse-che/che-dashboard.git',
          fileName: 'devfile.yaml',
        },
        factory: {
          params: 'url=https://github.com/eclipse-che/che-dashboard',
        },
      }),
    },
  },
});
export const editorContent = dump({
  schemaVersion: '2.2.0',
  metadata: {
    name: 'che-code',
  },
} as devfileApi.Devfile);
export const devworkspaceResources = `
apiVersion: workspace.devfile.io/v1alpha2
kind: DevWorkspaceTemplate
metadata:
  name: che-code
---
apiVersion: workspace.devfile.io/v1alpha2
kind: DevWorkspace
metadata:
  name: che-dashboard
spec:
  started: false
  template:
    components:
      - name: universal-developer-image
        container:
          image: quay.io/devfile/universal-developer-image:ubi8-latest
    projects:
      - name: che-dashboard
        git:
          remotes:
            origin: https://github.com/eclipse-che/che-dashboard.git
`;
export const targetDevWorkspace = {
  apiVersion: 'workspace.devfile.io/v1alpha2',
  kind: 'DevWorkspace',
  metadata: {
    annotations: {
      // 'che.eclipse.org/che-editor': 'che-incubator/che-code/insiders',
      'che.eclipse.org/last-updated-timestamp': `${timestampNew}`,
    },
    name: 'che-dashboard',
    namespace: namespace.name,
  },
  spec: {
    routingClass: 'che',
    started: false,
    template: {
      components: [
        {
          name: 'universal-developer-image',
          container: {
            image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
          },
        },
      ],
      projects: [
        {
          git: {
            remotes: { origin: 'https://github.com/eclipse-che/che-dashboard.git' },
          },
          name: 'che-dashboard',
        },
      ],
    },
  },
};
export const targetDevWorkspaceTemplate: devfileApi.DevWorkspaceTemplate = {
  apiVersion: 'workspace.devfile.io/v1alpha2',
  kind: 'DevWorkspaceTemplate',
  metadata: {
    annotations: {
      'che.eclipse.org/components-update-policy': 'managed',
      'che.eclipse.org/plugin-registry-url':
        'http://localhost/plugin-registry/v3/plugins/che-incubator/che-code/insiders/devfile.yaml',
    },
    name: 'che-code',
    namespace: namespace.name,
    ownerReferences: [
      {
        apiVersion: 'workspace.devfile.io/v1alpha2',
        kind: 'devworkspace',
        name: 'che-dashboard',
        uid: 'che-dashboard-test-uid',
      },
    ],
  },
};
