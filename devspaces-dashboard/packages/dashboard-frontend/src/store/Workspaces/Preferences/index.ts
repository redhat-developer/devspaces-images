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

export { actionCreators as workspacePreferencesActionCreators } from '@/store/Workspaces/Preferences/actions';
export { reducer as workspacePreferencesReducer } from '@/store/Workspaces/Preferences/reducer';
export * from '@/store/Workspaces/Preferences/selectors';
export {
  ActionCreators as WorkspacePreferencesActionCreators,
  State as WorkspacePreferencesState,
} from '@/store/Workspaces/Preferences/types';
