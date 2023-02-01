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

import { Action, Reducer } from 'redux';
import common from '@eclipse-che/common';
import { AppThunk } from '../..';
import { container } from '../../../inversify.config';
import { CheWorkspaceClient } from '../../../services/workspace-client/cheworkspace/cheWorkspaceClient';
import { createObject } from '../../helpers';
import { AUTHORIZED, SanityCheckAction } from '../../sanityCheckMiddleware';

const cheWorkspaceClient = container.get(CheWorkspaceClient);

export interface State {
  isLoading: boolean;
  settings: che.WorkspaceSettings;
  error?: string;
}

interface RequestWorkspaceSettingsAction extends Action, SanityCheckAction {
  type: 'REQUEST_WORKSPACE_SETTINGS';
}

interface ReceiveWorkspaceSettingsAction {
  type: 'RECEIVE_WORKSPACE_SETTINGS';
  settings: che.WorkspaceSettings;
}
interface ReceiveWorkspaceSettingsErrorAction {
  type: 'RECEIVE_WORKSPACE_SETTINGS_ERROR';
  error: string;
}

type KnownAction =
  | RequestWorkspaceSettingsAction
  | ReceiveWorkspaceSettingsAction
  | ReceiveWorkspaceSettingsErrorAction;

export type ActionCreators = {
  requestSettings: () => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestSettings:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      await dispatch({ type: 'REQUEST_WORKSPACE_SETTINGS', check: AUTHORIZED });

      try {
        const settings =
          await cheWorkspaceClient.restApiClient.getSettings<che.WorkspaceSettings>();
        dispatch({
          type: 'RECEIVE_WORKSPACE_SETTINGS',
          settings,
        });
      } catch (e) {
        const errorMessage =
          'Failed to fetch workspaces settings, reason: ' + common.helpers.errors.getMessage(e);
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

export const reducer: Reducer<State> = (
  state: State | undefined,
  incomingAction: Action,
): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case 'REQUEST_WORKSPACE_SETTINGS':
      return createObject(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_WORKSPACE_SETTINGS':
      return createObject(state, {
        isLoading: false,
        settings: action.settings,
      });
    case 'RECEIVE_WORKSPACE_SETTINGS_ERROR':
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
