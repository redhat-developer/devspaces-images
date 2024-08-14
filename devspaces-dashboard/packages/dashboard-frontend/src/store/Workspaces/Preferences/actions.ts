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

import common, { api } from '@eclipse-che/common';

import {
  addTrustedSource,
  getWorkspacePreferences,
} from '@/services/backend-client/workspacePreferencesApi';
import { AppThunk } from '@/store';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';
import { Type } from '@/store/Workspaces/Preferences/types';
import { ActionCreators, KnownAction } from '@/store/Workspaces/Preferences/types';

export const actionCreators: ActionCreators = {
  requestPreferences:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_PREFERENCES,
        check: AUTHORIZED,
      });
      if (!(await selectAsyncIsAuthorized(getState()))) {
        const error = selectSanityCheckError(getState());
        dispatch({
          type: Type.ERROR_PREFERENCES,
          error,
        });
        throw new Error(error);
      }

      const defaultKubernetesNamespace = selectDefaultNamespace(getState());
      try {
        const preferences = await getWorkspacePreferences(defaultKubernetesNamespace.name);
        dispatch({
          type: Type.RECEIVE_PREFERENCES,
          preferences,
        });
      } catch (error) {
        const errorMessage = common.helpers.errors.getMessage(error);
        dispatch({ type: Type.ERROR_PREFERENCES, error: errorMessage });
        throw error;
      }
    },

  addTrustedSource:
    (
      trustedSource: api.TrustedSourceAll | api.TrustedSourceUrl,
    ): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_PREFERENCES,
        check: AUTHORIZED,
      });
      if (!(await selectAsyncIsAuthorized(getState()))) {
        const error = selectSanityCheckError(getState());
        dispatch({
          type: Type.ERROR_PREFERENCES,
          error,
        });
        throw new Error(error);
      }

      const state = getState();
      const defaultKubernetesNamespace = selectDefaultNamespace(state);
      try {
        await addTrustedSource(defaultKubernetesNamespace.name, trustedSource);

        dispatch({
          type: Type.UPDATE_PREFERENCES,
        });
      } catch (error) {
        const errorMessage = common.helpers.errors.getMessage(error);
        dispatch({ type: Type.ERROR_PREFERENCES, error: errorMessage });
        throw error;
      }

      await dispatch(actionCreators.requestPreferences());
    },
};
