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

import { api } from '@eclipse-che/common';
import { Action } from 'redux';

import { SanityCheckAction } from '@/store/sanityCheckMiddleware';

export type GitConfigUser = api.IGitConfig['gitconfig']['user'];

export interface State {
  isLoading: boolean;
  config?: api.IGitConfig;
  error: string | undefined;
}

export enum Type {
  REQUEST_GITCONFIG = 'REQUEST_GITCONFIG',
  RECEIVE_GITCONFIG = 'RECEIVE_GITCONFIG',
  RECEIVE_GITCONFIG_ERROR = 'RECEIVE_GITCONFIG_ERROR',
}

export interface RequestGitConfigAction extends Action, SanityCheckAction {
  type: Type.REQUEST_GITCONFIG;
}

export interface ReceiveGitConfigAction extends Action {
  type: Type.RECEIVE_GITCONFIG;
  config: api.IGitConfig | undefined;
}

export interface ReceiveGitConfigErrorAction extends Action {
  type: Type.RECEIVE_GITCONFIG_ERROR;
  error: string;
}

export type KnownAction =
  | RequestGitConfigAction
  | ReceiveGitConfigAction
  | ReceiveGitConfigErrorAction;
