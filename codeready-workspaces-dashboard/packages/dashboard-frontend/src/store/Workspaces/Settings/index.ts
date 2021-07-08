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

import { Reducer } from 'redux';
import { AppThunk } from '../..';
import { container } from '../../../inversify.config';
import { CheWorkspaceClient } from '../../../services/workspace-client/cheWorkspaceClient';
import { getErrorMessage } from '../../../services/helpers/getErrorMessage';
import { createState } from '../../helpers';

const cheWorkspaceClient = container.get(CheWorkspaceClient);

export interface State {
  isLoading: boolean;
  settings: che.WorkspaceSettings;
  error?: string;
}

interface RequestWorkspaceSettingsAction {
  type: 'REQUEST_WORKSPACE_SETTINGS'
}

interface ReceiveWorkspaceSettingsAction {
  type: 'RECEIVE_WORKSPACE_SETTINGS';
  settings: che.WorkspaceSettings;
}
interface ReceiveWorkspaceSettingsErrorAction {
  type: 'RECEIVE_WORKSPACE_SETTINGS_ERROR';
  error: string;
}

type KnownAction = RequestWorkspaceSettingsAction
  | ReceiveWorkspaceSettingsAction
  | ReceiveWorkspaceSettingsErrorAction;

export type ActionCreators = {
  requestSettings: () => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {

  requestSettings: (): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'REQUEST_WORKSPACE_SETTINGS' });

    try {
      const settings = await cheWorkspaceClient.restApiClient.getSettings<che.WorkspaceSettings>();
      dispatch({
        type: 'RECEIVE_WORKSPACE_SETTINGS',
        settings,
      });
    } catch (e) {
      const errorMessage = 'Failed to fetch workspaces settings, reason: ' + getErrorMessage(e);
      dispatch({
        type: 'RECEIVE_WORKSPACE_SETTINGS_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }
  },
};

const unloadedState: State = {
  settings: {} as che.WorkspaceSettings,
  isLoading: false,
};

export const reducer: Reducer<State> = (state: State | undefined, action: KnownAction): State => {
  if (state === undefined) {
    return unloadedState;
  }

  switch (action.type) {
    case 'REQUEST_WORKSPACE_SETTINGS':
      return createState(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_WORKSPACE_SETTINGS':
      return createState(state, {
        isLoading: false,
        settings: action.settings,
      });
    case 'RECEIVE_WORKSPACE_SETTINGS_ERROR':
      return createState(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
