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

import { dump } from 'js-yaml';
import { ThunkDispatch } from 'redux-thunk';

import devfileApi from '@/services/devfileApi';
import { actionCreators, KnownAction } from '@/store/DevfileRegistries/index';
import { AppState } from '@/store/index';

export async function getEditor(
  editorIdOrPath: string,
  dispatch: ThunkDispatch<AppState, unknown, KnownAction>,
  getState: () => AppState,
): Promise<{ content?: string; editorYamlUrl: string; error?: string }> {
  let editorYamlUrl: string;

  const state = getState();

  if (/^(https?:\/\/)/.test(editorIdOrPath)) {
    editorYamlUrl = editorIdOrPath;
    let devfileObj = state.devfileRegistries.devfiles[editorYamlUrl];
    if (devfileObj) {
      const content = devfileObj.content;
      const error = devfileObj.error;
      return Object.assign({ content, editorYamlUrl, error });
    }
    await dispatch(actionCreators.requestDevfile(editorYamlUrl));

    const nexState = getState();
    devfileObj = nexState.devfileRegistries.devfiles[editorYamlUrl];
    if (devfileObj) {
      const content = devfileObj.content;
      const error = devfileObj.error;
      return Object.assign({ content, editorYamlUrl, error });
    }
    throw new Error(`Failed to fetch editor yaml by URL: ${editorYamlUrl}.`);
  } else {
    const editors = state.dwPlugins.cmEditors || [];
    const editor: devfileApi.Devfile | undefined = editors.find(e => {
      return (
        e.metadata.attributes.publisher +
          '/' +
          e.metadata.name +
          '/' +
          e.metadata.attributes.version ===
        editorIdOrPath
      );
    });
    if (editor) {
      return Object.assign({ content: dump(editor), editorYamlUrl: editorIdOrPath });
    } else {
      throw new Error(`Failed to fetch editor yaml by id: ${editorIdOrPath}.`);
    }
  }
}
