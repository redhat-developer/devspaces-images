/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { Store } from 'redux';
import createMockStore from 'redux-mock-store';
import { BrandingData } from '../../services/bootstrap/branding.constant';
import { FactoryResolver } from '../../services/helpers/types';
import { AppState } from '..';
import { State as DevfileRegistriesState } from '../DevfileRegistries/index';
import { ContainerCredentials, RegistryRow } from '../UserPreferences/types';
import { State as WorkspacesState } from '../Workspaces/index';
import { State as BrandingState } from '../Branding';
import { State as FactoryResolverState } from '../FactoryResolver';
import { State as InfrastructureNamespaceState } from '../InfrastructureNamespace';
import { State as PluginsState } from '../Plugins';
import { State as UserState } from '../User';
import { State as UserProfileState } from '../UserProfile';
import mockThunk from './thunk';
import { IDevWorkspace } from '@eclipse-che/devworkspace-client';

export class FakeStoreBuilder {

  private state: AppState = {
    factoryResolver: {
      isLoading: false,
      resolver: {},
    } as FactoryResolverState,
    plugins: {
      isLoading: false,
      plugins: [],
    } as PluginsState,
    workspaces: {
      isLoading: false,
      namespace: '',
      workspaceName: '',
      workspaceId: '',
      recentNumber: 5,
    } as WorkspacesState,
    cheWorkspaces: {
      isLoading: false,
      settings: {} as any,
      workspaces: [],
      workspacesLogs: new Map<string, string[]>(),
    },
    devWorkspaces: {
      isLoading: false,
      workspaces: [],
      workspacesLogs: new Map<string, string[]>(),
    },
    branding: {
      isLoading: false,
      data: {},
    } as BrandingState,
    devfileRegistries: {
      isLoading: false,
      devfiles: {},
      filter: '',
      metadata: [],
      schema: {},
    } as DevfileRegistriesState,
    user: {
      isLoading: false,
      user: {},
    } as UserState,
    userProfile: {
      isLoading: false,
      profile: {},
    } as UserProfileState,
    infrastructureNamespace: {
      isLoading: false,
      namespaces: [],
    } as InfrastructureNamespaceState,
    userPreferences: {
      isLoading: false,
      preferences: {}
    },
    dwPlugins: {
      isLoading: false,
      plugins: [],
    },
  };

  public withUserPreferences(registries: RegistryRow[], isLoading = false): FakeStoreBuilder {
    const newContainerCredentials: ContainerCredentials = {};
    registries.forEach(item => {
      const { url, username, password } = item;
      newContainerCredentials[url] = { username, password };
    });
    this.state.userPreferences.preferences = { dockerCredentials: btoa(JSON.stringify(newContainerCredentials)) };
    this.state.branding.isLoading = isLoading;
    return this;
  }

  public withBranding(branding: BrandingData, isLoading = false): FakeStoreBuilder {
    this.state.branding.data = Object.assign({}, branding);
    this.state.branding.isLoading = isLoading;
    return this;
  }

  public withFactoryResolver(resolver: FactoryResolver, isLoading = false): FakeStoreBuilder {
    this.state.factoryResolver.resolver = Object.assign({}, resolver);
    this.state.factoryResolver.isLoading = isLoading;
    return this;
  }

  public withInfrastructureNamespace(namespaces: che.KubernetesNamespace[], isLoading = false): FakeStoreBuilder {
    this.state.infrastructureNamespace.namespaces = Object.assign([], namespaces);
    this.state.infrastructureNamespace.isLoading = isLoading;
    return this;
  }

  public withPlugins(plugins: che.Plugin[], isLoading = false): FakeStoreBuilder {
    this.state.plugins.plugins = Object.assign([], plugins);
    this.state.plugins.isLoading = isLoading;
    return this;
  }

  public withUser(user: che.User): FakeStoreBuilder {
    this.state.user.user = Object.assign({}, user);
    return this;
  }

  public withUserProfile(profile: api.che.user.Profile): FakeStoreBuilder {
    this.state.userProfile.profile = Object.assign({}, profile);
    return this;
  }

  public withDevfileRegistries(
    options: {
      devfiles?: { [location: string]: { content: string, error: string } },
      metadata?: che.DevfileMetaData[],
      schema?: any,
    }, isLoading = false
  ): FakeStoreBuilder {
    if (options.devfiles) {
      this.state.devfileRegistries.devfiles = Object.assign({}, options.devfiles);
    }
    if (options.metadata) {
      this.state.devfileRegistries.metadata = Object.assign([], options.metadata);
    }
    if (options.schema) {
      this.state.devfileRegistries.schema = Object.assign({}, options.schema);
    }
    this.state.devfileRegistries.isLoading = isLoading;
    return this;
  }

  public withCheWorkspaces(
    options: {
      settings?: che.WorkspaceSettings,
      workspaces?: che.Workspace[],
      workspacesLogs?: Map<string, string[]>,
    },
    isLoading = false
  ): FakeStoreBuilder {
    if (options.settings) {
      this.state.cheWorkspaces.settings = Object.assign({}, options.settings);
    }
    if (options.workspaces) {
      this.state.cheWorkspaces.workspaces = Object.assign([], options.workspaces);
    }
    if (options.workspacesLogs) {
      this.state.cheWorkspaces.workspacesLogs = new Map(options.workspacesLogs);
    }
    this.state.cheWorkspaces.isLoading = isLoading;
    return this;
  }

  public withDevWorkspaces(
    options: {
      workspaces?: IDevWorkspace[],
      workspacesLogs?: Map<string, string[]>,
    },
    isLoading = false
  ): FakeStoreBuilder {
    if (options.workspaces) {
      this.state.devWorkspaces.workspaces = Object.assign([], options.workspaces);
    }
    if (options.workspacesLogs) {
      this.state.devWorkspaces.workspacesLogs = new Map(options.workspacesLogs);
    }
    this.state.devWorkspaces.isLoading = isLoading;
    return this;
  }

  public withWorkspaces(
    options: {
      namespace?: string,
      workspaceName?: string,
      workspaceId?: string,
      recentNumber?: number
    },
    isLoading = false
  ): FakeStoreBuilder {
    if (options.namespace) {
      this.state.workspaces.namespace = options.namespace;
    }
    if (options.workspaceName) {
      this.state.workspaces.workspaceName = options.workspaceName;
    }
    if (options.workspaceId) {
      this.state.workspaces.workspaceId = options.workspaceId;
    }
    if (options.recentNumber) {
      this.state.workspaces.recentNumber = options.recentNumber;
    }
    this.state.workspaces.isLoading = isLoading;
    return this;
  }

  public build(): Store {
    const middlewares = [mockThunk];
    const mockStore = createMockStore(middlewares);
    return mockStore(this.state);
  }

}
