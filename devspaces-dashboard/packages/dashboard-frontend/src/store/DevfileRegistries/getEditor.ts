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

import { ThunkDispatch } from 'redux-thunk';
import { AppState } from '../index';
import { KnownAction, actionCreators } from './index';

export async function getEditor(
  editorIdOrPath: string,
  dispatch: ThunkDispatch<AppState, unknown, KnownAction>,
  getState: () => AppState,
  pluginRegistryUrl?: string,
): Promise<{ content?: string; error?: string }> {
  let editorYamlUrl: string;

  if (/^(https?:\/\/)/.test(editorIdOrPath)) {
    editorYamlUrl = editorIdOrPath;
  } else {
    if (!pluginRegistryUrl) {
      throw new Error('Plugin registry URL is required.');
    }
    editorYamlUrl = `${pluginRegistryUrl}/plugins/${editorIdOrPath}/devfile.yaml`;
  }

  const state = getState();
  if (state.devfileRegistries.devfiles[editorYamlUrl]) {
    return state.devfileRegistries.devfiles[editorYamlUrl];
  }
  await dispatch(actionCreators.requestDevfile(editorYamlUrl));

  const nexState = getState();
  if (nexState.devfileRegistries.devfiles[editorYamlUrl]) {
    return nexState.devfileRegistries.devfiles[editorYamlUrl];
  }

  throw new Error(`Failed to fetch editor yaml by URL: ${editorYamlUrl}.`);
}
