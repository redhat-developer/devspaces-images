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

import { Location } from 'history';
import React from 'react';

import { WorkspaceAction } from '@/services/helpers/types';

export type WantDelete = [string, ...string[]];
export type ArrayNonempty<T> = [T, ...T[]];

export type ActionContextType = {
  handleAction: (action: WorkspaceAction, uid: string) => Promise<Location | void>;
  showConfirmation: (wantDelete: WantDelete) => Promise<void>;
  toDelete: string[];
};

/* c8 ignore next 10 */
const defaultValue: ActionContextType = {
  handleAction: () => {
    console.warn('Workspace actions context is not created yet');
    return Promise.resolve();
  },
  showConfirmation: () => {
    console.warn('Workspace actions context is not created yet');
    return Promise.resolve();
  },
  toDelete: [],
};

export const WorkspaceActionsContext = React.createContext<ActionContextType>(defaultValue);

export const WorkspaceActionsConsumer = WorkspaceActionsContext.Consumer;
