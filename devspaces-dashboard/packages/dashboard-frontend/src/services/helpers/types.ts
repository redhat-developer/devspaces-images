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

import { AlertVariant } from '@patternfly/react-core';
import * as React from 'react';

import devfileApi from '@/services/devfileApi';
import { che } from '@/services/models';

export type ActionCallback = {
  title: string;
  callback: () => void;
};

export interface AlertItem {
  key: string;
  title: string;
  variant: AlertVariant;
  children?: React.ReactNode;
  actionCallbacks?: ActionCallback[];
  error?: never;
  timeout?: boolean | number;
}

// Field `source` tells where devfile comes from
//  - no source: the url to raw content is used
//  - "repo": means no devfile is found and default is generated
//  - any other - devfile is found in repository as filename from the value
export interface FactoryResolver extends Omit<che.api.factory.Factory, 'devfile'> {
  devfile?: che.api.workspace.devfile.Devfile | devfileApi.Devfile;
  location?: string;
  scm_info?: FactoryResolverScmInfo;
}

export type FactoryResolverScmInfo = {
  clone_url: string;
  scm_provider: string;
  branch?: string;
};

export type DevfileV2ProjectSource = {
  name: string;
  git: {
    remotes: { origin: string };
    checkoutFrom?: { revision: string };
  };
};

export type DeprecatedWorkspaceStatus = 'Deprecated';

export enum WorkspaceStatus {
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  STARTING = 'STARTING',
  ERROR = 'ERROR',
}

export enum DevWorkspaceStatus {
  FAILED = 'Failed',
  FAILING = 'Failing',
  STARTING = 'Starting',
  TERMINATING = 'Terminating',
  RUNNING = 'Running',
  STOPPED = 'Stopped',
  STOPPING = 'Stopping',
}

export function isDevWorkspaceStatus(status: unknown): status is DevWorkspaceStatus {
  return Object.values(DevWorkspaceStatus).includes(status as DevWorkspaceStatus);
}

export enum LoaderTab {
  Progress = 'Progress',
  Logs = 'Logs',
  Events = 'Events',
}

export enum WorkspaceDetailsTab {
  OVERVIEW = 'Overview',
  DEVFILE = 'Devfile',
  EVENTS = 'Events',
  LOGS = 'Logs',
}

export enum WorkspaceAction {
  DELETE_WORKSPACE = 'Delete Workspace',
  OPEN_IDE = 'Open',
  RESTART_WORKSPACE = 'Restart Workspace',
  START_DEBUG_AND_OPEN_LOGS = 'Open in Debug mode',
  START_IN_BACKGROUND = 'Start in background',
  STOP_WORKSPACE = 'Stop Workspace',
}

export enum UserPreferencesTab {
  CONTAINER_REGISTRIES = 'ContainerRegistries',
  GIT_SERVICES = 'GitServices',
  GITCONFIG = 'Gitconfig',
  PERSONAL_ACCESS_TOKENS = 'PersonalAccessTokens',
  SSH_KEYS = 'SshKeys',
}
