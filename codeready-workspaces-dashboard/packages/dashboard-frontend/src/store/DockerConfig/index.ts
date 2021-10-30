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

import { Action } from 'redux';
import { AppThunk } from '..';
import * as CheWorkspacesStore from './che';
import * as DevWorkspacesStore from './dw';
import { RegistryEntry } from './types';
import { selectDefaultNamespace } from '../InfrastructureNamespaces/selectors';
import { selectDevworkspacesEnabled } from '../Workspaces/Settings/selectors';

export type ActionCreators = {
  requestCredentials: () => AppThunk<Action, Promise<void>>;
  updateCredentials: (registries: RegistryEntry[]) => AppThunk<Action, Promise<void>>
};

export const actionCreators: ActionCreators = {

  requestCredentials: (): AppThunk<Action, Promise<void>> => async (dispatch, getState): Promise<void> => {
    const state = getState();
    if (selectDevworkspacesEnabled(state)) {
      const namespace = selectDefaultNamespace(state).name;
      await dispatch(DevWorkspacesStore.actionCreators.requestCredentials(namespace));
    } else {
      await dispatch(CheWorkspacesStore.actionCreators.requestCredentials());
    }
  },

  updateCredentials: (registries: RegistryEntry[]): AppThunk<Action, Promise<void>> => async (dispatch, getState): Promise<void> => {
    const state = getState();
    if (selectDevworkspacesEnabled(state)) {
      const namespace = selectDefaultNamespace(state).name;
      await dispatch(DevWorkspacesStore.actionCreators.updateCredentials(namespace, registries));
    } else {
      await dispatch(CheWorkspacesStore.actionCreators.updateCredentials(registries));
    }
  }

};
