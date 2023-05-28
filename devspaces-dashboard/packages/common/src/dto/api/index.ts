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

import { V1alpha2DevWorkspace, V221DevfileComponents } from '@devfile/api';
import { CoreV1EventList, V1PodList } from '@kubernetes/client-node';
import * as webSocket from './webSocket';

export { webSocket };

export type GitOauthProvider =
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'azure-devops';

export type GitProvider =
  | 'github'
  | 'gitlab'
  | 'bitbucket-server'
  | 'azure-devops';

export type PersonalAccessToken = {
  cheUserId: string;
  tokenName: string;
  tokenData: string; // base64 encoded
  gitProviderEndpoint: string;
  gitProviderUsername: string;
} & (
  | {
      gitProvider: Exclude<GitProvider, 'azure-devops'>;
    }
  | {
      gitProvider: Extract<GitProvider, 'azure-devops'>;
      gitProviderOrganization: string;
    }
);

export interface IPatch {
  op: string;
  path: string;
  value?: any;
}

export interface IDockerConfig {
  dockerconfig: string;
  resourceVersion?: string;
}

export interface IWorkspacesDefaultPlugins {
  editor: string;
  plugins: string[];
}

export interface IExternalDevfileRegistry {
  url: string;
}

export interface IServerConfig {
  containerBuild: {
    containerBuildConfiguration?: {
      openShiftSecurityContextConstraint?: string;
    };
    disableContainerBuildCapabilities?: boolean;
  };
  defaults: {
    editor: string | undefined;
    components: V221DevfileComponents[];
    plugins: IWorkspacesDefaultPlugins[];
    pvcStrategy: string | undefined;
  };
  devfileRegistry: {
    disableInternalRegistry: boolean;
    externalDevfileRegistries: IExternalDevfileRegistry[];
  };
  pluginRegistry: {
    openVSXURL: string;
  };
  timeouts: {
    inactivityTimeout: number;
    runTimeout: number;
    startTimeout: number;
  };
  cheNamespace: string;
  pluginRegistryURL: string;
  pluginRegistryInternalURL: string;
  devfileRegistryURL: string;
  devfileRegistryInternalURL: string;
}

export interface IUserProfile {
  email: string;
  username: string;
}

export type IEventList = CoreV1EventList;
export type IPodList = V1PodList;
export type PodLogs = {
  [containerName: string]: {
    logs: string;
    failure: boolean;
  };
};

export interface IDevWorkspaceList {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    resourceVersion?: string;
  };
  items: V1alpha2DevWorkspace[];
}

export interface IDevWorkspaceResources {
  devfileContent: string | undefined;
  editorPath: string | undefined;
  pluginRegistryUrl: string | undefined;
  editorId: string | undefined;
  editorContent: string | undefined;
}
