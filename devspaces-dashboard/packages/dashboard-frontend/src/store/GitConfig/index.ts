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

import common, { api, helpers } from '@eclipse-che/common';

import { fetchGitConfig, patchGitConfig } from '@/services/backend-client/gitConfigApi';
import { GitConfigUser, KnownAction, Type } from '@/store/GitConfig/types';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';

import { AppThunk } from '..';

export * from './reducer';
export * from './types';

export type ActionCreators = {
  requestGitConfig: () => AppThunk<KnownAction, Promise<void>>;
  updateGitConfig: (gitconfig: GitConfigUser) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestGitConfig:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      const state = getState();
      const namespace = selectDefaultNamespace(state).name;
      try {
        await dispatch({ type: Type.REQUEST_GITCONFIG, check: AUTHORIZED });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          throw new Error(error);
        }
        const config = await fetchGitConfig(namespace);
        dispatch({
          type: Type.RECEIVE_GITCONFIG,
          config,
        });
      } catch (e) {
        if (common.helpers.errors.includesAxiosResponse(e) && e.response.status === 404) {
          dispatch({
            type: Type.RECEIVE_GITCONFIG,
            config: undefined,
          });
          return;
        }

        const errorMessage = helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_GITCONFIG_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },

  updateGitConfig:
    (changedGitConfig: GitConfigUser): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      const state = getState();
      const namespace = selectDefaultNamespace(state).name;
      const { gitConfig } = state;
      const gitconfig = Object.assign(gitConfig.config || {}, {
        gitconfig: {
          user: changedGitConfig,
        },
      } as api.IGitConfig);
      try {
        await dispatch({ type: Type.REQUEST_GITCONFIG, check: AUTHORIZED });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          throw new Error(error);
        }
        const updated = await patchGitConfig(namespace, gitconfig);
        dispatch({
          type: Type.RECEIVE_GITCONFIG,
          config: updated,
        });
      } catch (e) {
        const errorMessage = helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_GITCONFIG_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },
};
