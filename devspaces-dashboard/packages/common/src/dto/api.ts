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

import { V220DevfileComponents } from '@devfile/api';

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

export interface IServerConfig {
  containerBuild: {
    containerBuildConfiguration?: {
      openShiftSecurityContextConstraint?: string;
    };
    disableContainerBuildCapabilities?: boolean;
  };
  defaults: {
    editor: string | undefined;
    components: V220DevfileComponents[];
    plugins: IWorkspacesDefaultPlugins[];
    pvcStrategy: string | undefined;
  };
  pluginRegistry: {
    openVSXURL: string;
  };
  timeouts: {
    inactivityTimeout: number;
    runTimeout: number;
  };
  cheNamespace: string;
}

export interface IUserProfile {
  email: string;
  username: string;
}
