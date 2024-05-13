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

import React from 'react';

import { WorkspaceAction } from '@/services/helpers/types';

import { ActionContextType } from '..';

const defaultValue: ActionContextType = {
  handleAction: async (action: WorkspaceAction, uid: string) => {
    console.info('Workspace action "%s" on workspace "%s" is handled', action, uid);
  },
  showConfirmation: async (wantDelete: string[]) => {
    console.info('Confirmation is shown for deleting workspaces: %s', wantDelete.join(', '));
  },
  toDelete: [],
};

export const WorkspaceActionsContext = React.createContext<ActionContextType>(defaultValue);
export const WorkspaceActionsConsumer = WorkspaceActionsContext.Consumer;
