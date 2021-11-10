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

import { AlertVariant } from '@patternfly/react-core';
import * as React from 'react';

export interface AlertItem {
  key: string;
  title: string;
  variant: AlertVariant;
  children?: React.ReactNode;
}

export interface FactoryResolver {
  v: string;
  source?: string;
  devfile: api.che.workspace.devfile.Devfile;
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

export type CreateWorkspaceTab = 'quick-add' | 'custom-workspace';

export enum IdeLoaderTab {
  Progress = 0,
  Logs = 1,
}

export enum WorkspaceDetailsTab {
  OVERVIEW = 'Overview',
  DEVFILE = 'Devfile',
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
  EDIT_WORKSPACE = 'Edit Workspace',
}

export type UserPreferencesTab = 'container-registries';
