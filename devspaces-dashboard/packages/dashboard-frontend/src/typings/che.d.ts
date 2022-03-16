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

declare namespace che {
  export interface Workspace {
    id: string;
    projects?: any;
    links?: {
      ide?: string;
      [rel: string]: string | undefined;
    };
    temporary?: boolean;
    status: string;
    namespace?: string;
    attributes?: WorkspaceAttributes;
    devfile: WorkspaceDevfile;
    runtime?: WorkspaceRuntime;
    isLocked?: boolean;
    usedResources?: string;
  }

  export type WorkspaceStorageType = 'async' | 'ephemeral' | 'persistent';

  export interface WorkspaceSettings {
    cheWorkspaceDevfileRegistryUrl?: string;
    cheWorkspacePluginRegistryUrl?: string;
    'che.workspace.storage.available_types': string;
    'che.workspace.storage.preferred_type': WorkspaceStorageType;
    supportedRecipeTypes: string;
    'che.factory.default_plugins'?: string;
    'che.factory.default_editor': string;
    'che.devworkspaces.enabled': 'true' | 'false';
  }

  export interface Plugin {
    id: string;
    name: string;
    publisher: string;
    deprecate?: {
      automigrate: boolean;
      migrateTo: string;
    };
    displayName: string;
    type: string;
    version?: string;
    description?: string;
    isEnabled?: boolean;
  }

  export interface WorkspaceAttributes {
    created: string;
    updated?: string;
    stopped?: string;
    stackId?: string;
    stackName?: string;
    errorMessage?: string;
    infrastructureNamespace: string;
    convertedId?: string;

    [propName: string]: string | number | undefined;
  }

  export interface WorkspaceDevfileAttributes {
    persistVolumes?: 'false' | 'true';
    asyncPersist?: 'false' | 'true';
    editor?: string;
    plugins?: string;
    [key: string]: string;
  }

  export interface WorkspaceDevfile {
    apiVersion: string;
    components: Array<any>;
    projects?: Array<any>;
    commands?: Array<any>;
    attributes?: che.WorkspaceDevfileAttributes;
    metadata: {
      name?: string;
      generateName?: string;
    };
  }

  export interface WorkspaceRuntime {
    activeEnv: string;
    status: string;
    machines: {
      [machineName: string]: WorkspaceRuntimeMachine;
    };
    machineToken?: string;
  }

  export interface WorkspaceWarning {
    code?: number;
    message: string;
  }

  export interface WorkspaceRuntimeMachine {
    attributes: { [propName: string]: string };
    servers: { [serverName: string]: WorkspaceRuntimeMachineServer };
    status: string;
  }

  export interface WorkspaceRuntimeMachineServer {
    status: string;
    url: string;
    attributes: { [propName: string]: string };
  }

  export interface ProfileAttributes {
    firstName?: string;
    lastName?: string;

    [propName: string]: string | number | undefined;
  }

  export interface Profile {
    attributes?: ProfileAttributes;
    email: string;
    links?: Array<any>;
    userId: string;
  }

  export interface User {
    links: any[];
    attributes?: {
      firstName?: string;
      lastName?: string;
      [propName: string]: string | number | undefined;
    };
    id: string;
    name: string;
    email: string;
    family_name?: string;
    given_name?: string;
    preferred_username?: string;
    sub?: string;
  }

  export interface UserPreferences {
    [key: string]: string;
  }

  export interface DevfileMetaData {
    displayName: string;
    description?: string;
    globalMemoryLimit?: string;
    registry?: string;
    icon: string;
    links: {
      v2?: string;
      devWorkspaces?: {
        [editorId: string]: string;
      };
      self: string;
      [key: string]: any;
    };
    tags: Array<string>;
  }

  export interface KubernetesNamespace {
    name: string;
    attributes: {
      default?: 'true' | 'false';
      displayName?: string;
      phase: string;
    };
  }
}

declare module 'che' {
  export = che;
}
