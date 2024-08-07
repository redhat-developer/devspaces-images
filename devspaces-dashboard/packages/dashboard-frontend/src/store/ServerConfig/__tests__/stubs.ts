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

import { api } from '@eclipse-che/common';

export const serverConfig: api.IServerConfig = {
  containerBuild: {
    disableContainerBuildCapabilities: false,
    containerBuildConfiguration: {
      openShiftSecurityContextConstraint: 'container-build',
    },
  },
  defaults: {
    editor: 'eclipse/theia/next',
    components: [
      {
        name: 'universal-developer-image',
        container: {
          image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
        },
      },
    ],
    plugins: [
      {
        editor: 'eclipse/theia/next',
        plugins: ['https://test.com/devfile.yaml'],
      },
    ],
    pvcStrategy: 'per-workspace',
  },
  pluginRegistry: {
    openVSXURL: 'https://open-vsx.org',
  },
  timeouts: {
    inactivityTimeout: -1,
    runTimeout: -1,
    startTimeout: 300,
  },
  defaultNamespace: {
    autoProvision: true,
  },
  cheNamespace: 'eclipse-che',
  devfileRegistry: {
    disableInternalRegistry: false,
    externalDevfileRegistries: [{ url: 'https://devfile.io/' }],
  },
  pluginRegistryURL: 'https://test/plugin-registry/v3',
  pluginRegistryInternalURL: 'http://plugin-registry.eclipse-che.svc:8080/v3',
  dashboardLogo: {
    base64data: 'base64-encoded-data',
    mediatype: 'image/png',
  },
};
