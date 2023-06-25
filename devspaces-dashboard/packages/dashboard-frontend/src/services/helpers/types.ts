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

import { AlertVariant } from '@patternfly/react-core';
import * as React from 'react';
import devfileApi from '../devfileApi';

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

export interface FactoryResolver {
  v: string;
  source?: string;
  devfile: devfileApi.Devfile | che.WorkspaceDevfile;
  location?: string;
  scm_info?: FactoryResolverScmInfo;
  links: api.che.core.rest.Link[];
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

export type CreateWorkspaceTab = 'quick-add' | 'custom-workspace';

export enum LoaderTab {
  Progress = 'Progress',
  Logs = 'Logs',
  Events = 'Events',
}

export enum WorkspaceDetailsTab {
  OVERVIEW = 'Overview',
  DEVFILE = 'Devfile',
  DEVWORKSPACE = 'DevWorkspace',
  EVENTS = 'Events',
  LOGS = 'Logs',
}

export enum WorkspaceAction {
  OPEN_IDE = 'Open',
  START_DEBUG_AND_OPEN_LOGS = 'Open in verbose mode',
  START_IN_BACKGROUND = 'Start in background',
  STOP_WORKSPACE = 'Stop Workspace',
  DELETE_WORKSPACE = 'Delete Workspace',
  ADD_PROJECT = 'Add Project',
  ADD_CUSTOM_WORKSPACE = 'Add Workspace',
  RESTART_WORKSPACE = 'Restart Workspace',
  WORKSPACE_DETAILS = 'Workspace Details',
}

export type UserPreferencesTab = 'container-registries' | 'git-services' | 'personal-access-tokens';
