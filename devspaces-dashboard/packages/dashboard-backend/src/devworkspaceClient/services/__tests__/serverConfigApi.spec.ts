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

/* eslint-disable @typescript-eslint/no-unused-vars */

import * as mockClient from '@kubernetes/client-node';
import { CustomObjectsApi } from '@kubernetes/client-node';

import { CheClusterCustomResource, CustomResourceDefinitionList } from '@/devworkspaceClient';
import { ServerConfigApiService } from '@/devworkspaceClient/services/serverConfigApi';

jest.mock('@/helpers/getUserName.ts');

describe('Server Config API Service', () => {
  const env = process.env;
  let serverConfigService: ServerConfigApiService;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      CHECLUSTER_CR_NAME: 'eclipse-che',
      CHECLUSTER_CR_NAMESPACE: 'eclipse-che',
    };

    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();

    kubeConfig.makeApiClient = jest.fn().mockImplementation((_api: unknown) => {
      return {
        listClusterCustomObject: () => {
          return Promise.resolve(buildCustomResourceList());
        },
      } as unknown as CustomObjectsApi;
    });

    serverConfigService = new ServerConfigApiService(kubeConfig);
  });

  afterEach(() => {
    process.env = env;
    jest.clearAllMocks();
  });

  test('fetching custom resource definition', async () => {
    const res = await serverConfigService.fetchCheCustomResource();
    expect(res).toEqual(buildCustomResource());
  });

  test('getting container build options', () => {
    const res = serverConfigService.getContainerBuild(buildCustomResource());
    expect(res.containerBuildConfiguration).toEqual(
      expect.objectContaining({
        openShiftSecurityContextConstraint: 'container-build',
      }),
    );
    expect(res.disableContainerBuildCapabilities).toEqual(false);
  });

  test('getting default plugins', () => {
    const res = serverConfigService.getDefaultPlugins(buildCustomResource());
    expect(res).toEqual([]);
  });

  test('getting default editor', () => {
    const res = serverConfigService.getDefaultEditor(buildCustomResource());
    expect(res).toEqual('eclipse/che-theia/latest');
  });

  test('getting default components', () => {
    const res = serverConfigService.getDefaultComponents(buildCustomResource());
    expect(res).toEqual([{ container: { image: 'component-image' }, name: 'component-name' }]);
  });

  test('getting openVSXURL from the CR', () => {
    const openVSXURL = 'https://open-vsx.org';
    const res = serverConfigService.getPluginRegistry(buildCustomResource({ openVSXURL }));
    expect(res).toEqual({ openVSXURL: 'https://open-vsx.org' });
  });

  test('getting openVSXURL from the env var', () => {
    process.env.CHE_DEFAULT_SPEC_COMPONENTS_PLUGINREGISTRY_OPENVSXURL = 'https://open-vsx.org';
    const res = serverConfigService.getPluginRegistry(buildCustomResource());
    expect(res).toEqual({ openVSXURL: 'https://open-vsx.org' });
  });

  test('getting empty openVSXURL from the env var', () => {
    process.env.CHE_DEFAULT_SPEC_COMPONENTS_PLUGINREGISTRY_OPENVSXURL = '';
    const res = serverConfigService.getPluginRegistry(buildCustomResource());
    expect(res).toEqual({ openVSXURL: '' });
  });

  test('getting PVC strategy', () => {
    const res = serverConfigService.getPvcStrategy(buildCustomResource());
    expect(res).toEqual('per-user');
  });

  test('getting dashboard warning', () => {
    const res = serverConfigService.getDashboardWarning(buildCustomResource());
    expect(res).toEqual('dashboard banner text');
  });

  test('getting running workspaces limit', () => {
    const res = serverConfigService.getRunningWorkspacesLimit(buildCustomResource());
    expect(res).toEqual(1);
  });

  test('getting running workspaces cluster limit', () => {
    const res = serverConfigService.getRunningWorkspacesClusterLimit(buildCustomResource());
    expect(res).toEqual(100);
  });

  test('getting workspace inactivity timeout', () => {
    const res = serverConfigService.getWorkspaceInactivityTimeout(buildCustomResource());
    expect(res).toEqual(1800);
  });

  test('getting workspace run timeout', () => {
    const res = serverConfigService.getWorkspaceRunTimeout(buildCustomResource());
    expect(res).toEqual(-1);
  });

  test('getting internal registry disable status', () => {
    const customResource = buildCustomResource();
    let res = serverConfigService.getInternalRegistryDisableStatus(customResource);
    expect(res).toBeFalsy();

    if (customResource.spec.components?.devfileRegistry) {
      customResource.spec.components.devfileRegistry.disableInternalRegistry = true;
    }
    res = serverConfigService.getInternalRegistryDisableStatus(customResource);
    expect(res).toBeTruthy();
  });

  test('getting external devfile registries', () => {
    const res = serverConfigService.getExternalDevfileRegistries(buildCustomResource());
    expect(res.length).toEqual(1);
    expect(res[0]?.url).toEqual('https://devfile.registry.test.org/');
  });

  test('getting default plugin registry URL', () => {
    const res = serverConfigService.getDefaultPluginRegistryUrl(buildCustomResource());
    expect(res).toEqual('http://plugin-registry.eclipse-che.svc/v3');
  });

  test('getting autoProvision value', () => {
    const res = serverConfigService.getAutoProvision(buildCustomResource());
    expect(res).toBeTruthy();
  });

  test('getting advanced authorization object', () => {
    const res = serverConfigService.getAdvancedAuthorization(buildCustomResource());
    expect(res).toEqual({ allowUsers: ['user1', 'user2'] });
  });

  test('getting allowed source urls', () => {
    const res = serverConfigService.getAllowedSourceUrls(buildCustomResource());
    expect(res).toEqual(['https://github.com']);
  });
});

function buildCustomResourceList(): { body: CustomResourceDefinitionList } {
  return {
    body: {
      apiVersion: 'org.eclipse.che/v2',
      items: [buildCustomResource()],
      kind: 'CheClusterList',
    },
  };
}

function buildCustomResource(options?: { openVSXURL?: string }): CheClusterCustomResource {
  return {
    apiVersion: 'org.eclipse.che/v2',
    kind: 'CheCluster',
    metadata: {
      name: 'eclipse-che',
      namespace: 'eclipse-che',
    },
    spec: {
      components: {
        dashboard: {
          headerMessage: {
            show: true,
            text: 'dashboard banner text',
          },
        },
        devWorkspace: {},
        pluginRegistry: options?.openVSXURL ? { openVSXURL: options.openVSXURL } : {},
        devfileRegistry: {
          externalDevfileRegistries: [
            {
              url: 'https://devfile.registry.test.org/',
            },
          ],
        },
      },
      devEnvironments: {
        disableContainerBuildCapabilities: false,
        containerBuildConfiguration: {
          openShiftSecurityContextConstraint: 'container-build',
        },
        defaultComponents: [
          {
            container: {
              image: 'component-image',
            },
            name: 'component-name',
          },
        ],
        defaultNamespace: {
          autoProvision: true,
        },
        defaultEditor: 'eclipse/che-theia/latest',
        secondsOfInactivityBeforeIdling: 1800,
        secondsOfRunBeforeIdling: -1,
        maxNumberOfRunningWorkspacesPerCluster: 100,
        storage: { pvcStrategy: 'per-user' },
        allowedSources: {
          urls: ['https://github.com'],
        },
      },
      networking: {
        auth: {
          advancedAuthorization: {
            allowUsers: ['user1', 'user2'],
          },
        },
      },
    },
    status: {
      pluginRegistryURL: 'http://plugin-registry.eclipse-che.svc/v3',
    },
  } as CheClusterCustomResource;
}
