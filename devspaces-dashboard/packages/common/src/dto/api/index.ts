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

import {
  V1alpha2DevWorkspace,
  V230Devfile,
  V230DevfileComponents,
} from '@devfile/api';
import { CoreV1EventList, V1PodList } from '@kubernetes/client-node';
import * as webSocket from './webSocket';
import { ReadStream } from 'fs';

export { webSocket };

export type GitOauthProvider =
  | 'github'
  | 'github_2'
  | 'gitlab'
  | 'bitbucket'
  | 'bitbucket-server'
  | 'azure-devops';

// The list of available Git providers for PAT
// https://eclipse.dev/che/docs/stable/end-user-guide/using-a-git-provider-access-token/
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
} & (
  | {
      gitProvider: Exclude<GitProvider, 'azure-devops'>;
    }
  | {
      gitProvider: Extract<GitProvider, 'azure-devops'>;
      gitProviderOrganization: string;
    }
);

export type SshKey = {
  creationTimestamp?: Date;
  name: string;
  /**
   * base64 encoded public key.
   */
  keyPub: string;
};
export type NewSshKey = Omit<SshKey, 'creationTimestamp'> & {
  /**
   * base64 encoded private key.
   */
  key: string;
};

export interface IPatch {
  op: string;
  path: string;
  value?: any;
}

export interface IDockerConfig {
  dockerconfig: string;
  resourceVersion?: string;
}

export interface IGitConfig {
  resourceVersion?: string;
  gitconfig: {
    user: {
      name: string;
      email: string;
    };
    [section: string]: {
      [key: string]: string;
    };
  };
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
    components: V230DevfileComponents[];
    plugins: IWorkspacesDefaultPlugins[];
    pvcStrategy: string | undefined;
  };
  devfileRegistry: {
    disableInternalRegistry: boolean;
    externalDevfileRegistries: IExternalDevfileRegistry[];
  };
  pluginRegistry: IPluginRegistry;
  timeouts: {
    inactivityTimeout: number;
    runTimeout: number;
    startTimeout: number;
  };
  networking?: {
    auth?: {
      advancedAuthorization: IAdvancedAuthorization;
    };
  };
  defaultNamespace: {
    autoProvision: boolean;
  };
  cheNamespace: string;
  pluginRegistryURL: string;
  pluginRegistryInternalURL: string;
  dashboardLogo?: { base64data: string; mediatype: string };
}

export interface IAdvancedAuthorization {
  allowUsers?: string[];
  allowGroups?: string[];
  denyUsers?: string[];
  denyGroups?: string[];
}

export interface IPluginRegistry {
  disableInternalRegistry?: boolean;
  externalPluginRegistries?: { url: string }[];
  openVSXURL?: string;
}

export interface IUserProfile {
  email: string;
  username: string;
}
export interface IDevWorkspacePreferences {
  'skip-authorisation': GitProvider[];
  [key: string]: string | string[];
}

export type IEditors = Array<V230Devfile>;

export type IEventList = CoreV1EventList;
export type IPodList = V1PodList;

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

export interface IGettingStartedSample {
  displayName: string;
  description?: string;
  icon: { base64data: string; mediatype: string };
  url: string;
  tags?: Array<string>;
}

export interface IAirGapSample extends IGettingStartedSample {
  project?: { zip?: { filename?: string } };
  devfile?: { filename?: string };
}

export interface IStreamedFile {
  stream: ReadStream;
  size: number;
}
