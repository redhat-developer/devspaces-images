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

import common from '@eclipse-che/common';
import { includesAxiosResponse } from '@eclipse-che/common/lib/helpers/errors';
import { dump, load } from 'js-yaml';
import { ThunkDispatch } from 'redux-thunk';

import devfileApi, { isDevfileV2 } from '@/services/devfileApi';
import { ICheEditorYaml } from '@/services/workspace-client/devworkspace/devWorkspaceClient';
import { AppState } from '@/store';
import { KnownAction } from '@/store/DevfileRegistries';
import { getEditor } from '@/store/DevfileRegistries/getEditor';

/**
 * Returns an error message for the sanity check service
 */
export function getErrorMessage(error: unknown): string {
  let errorMessage = 'Check the browser logs message.';

  if (typeof error === 'object' && error !== null) {
    const { request, response } = error as { [propName: string]: any };
    const code = response?.status ? response?.status : response?.request?.status;
    const endpoint = request?.responseURL ? request?.responseURL : response?.request?.responseURL;

    if (!code || !endpoint) {
      return 'Unexpected error type. Please report a bug.';
    }

    errorMessage = `HTTP Error code ${code}. Endpoint which throws an error ${endpoint}. ${errorMessage}`;
  }

  if (isUnauthorized(error) || isForbidden(error)) {
    errorMessage += ' User session has expired. You need to re-login to the Dashboard.';
  }

  return errorMessage;
}

/**
 * Checks for login page in the axios response data
 */
export function hasLoginPage(error: unknown): boolean {
  if (includesAxiosResponse(error)) {
    const response = error.response;
    if (typeof response.data === 'string') {
      try {
        const doc = new DOMParser().parseFromString(response.data, 'text/html');
        const docText = doc.documentElement.textContent;
        if (docText && docText.toLowerCase().indexOf('log in') !== -1) {
          return true;
        }
      } catch (e) {
        // no op
      }
    }
  }
  return false;
}

/**
 * Checks for HTTP 401 Unauthorized response status code
 */
export function isUnauthorized(error: unknown): boolean {
  return hasStatus(error, 401);
}

/**
 * Checks for HTTP 403 Forbidden
 */
export function isForbidden(error: unknown): boolean {
  return hasStatus(error, 403);
}

/**
 * Checks for HTTP 500 Internal Server Error
 */
export function isInternalServerError(error: unknown): boolean {
  return hasStatus(error, 500);
}

function hasStatus(error: unknown, _status: number): boolean {
  if (typeof error === 'string') {
    if (error.toLowerCase().includes(`http status ${_status}`)) {
      return true;
    }
  } else if (common.helpers.errors.isError(error)) {
    const str = error.message.toLowerCase();
    if (str.includes(`status code ${_status}`)) {
      return true;
    }
  } else if (typeof error === 'object' && error !== null) {
    const { status, statusCode } = error as { [propName: string]: string | number };
    if (statusCode == _status || status == _status) {
      return true;
    } else {
      try {
        const str = JSON.stringify(error).toLowerCase();
        if (str.includes(`http status ${_status}`)) {
          return true;
        } else if (str.includes(`status code ${_status}`)) {
          return true;
        }
      } catch (e) {
        // no-op
      }
    }
  }
  return false;
}

export const CHE_EDITOR_YAML_PATH = '.che/che-editor.yaml';

/**
 * Look for the custom editor in .che/che-editor.yaml
 */
export async function getCustomEditor(
  pluginRegistryUrl: string | undefined,
  optionalFilesContent: { [fileName: string]: string },
  dispatch: ThunkDispatch<AppState, unknown, KnownAction>,
  getState: () => AppState,
): Promise<string | undefined> {
  let editorsDevfile: devfileApi.Devfile | undefined = undefined;

  // do we have a custom editor specified in the repository ?
  const cheEditorYaml = optionalFilesContent[CHE_EDITOR_YAML_PATH]
    ? (load(optionalFilesContent[CHE_EDITOR_YAML_PATH]) as ICheEditorYaml)
    : undefined;

  if (cheEditorYaml) {
    // check the content of cheEditor file
    console.debug('Using the repository .che/che-editor.yaml file', cheEditorYaml);

    let repositoryEditorYaml: devfileApi.Devfile | undefined = undefined;
    let repositoryEditorYamlUrl: string | undefined = undefined;
    // it's an inlined editor, use the inline content
    if (cheEditorYaml.inline) {
      console.debug('Using the inline content of the repository editor');
      repositoryEditorYaml = cheEditorYaml.inline;
    } else if (cheEditorYaml.id) {
      // load the content of this editor
      console.debug(`Loading editor from its id ${cheEditorYaml.id}`);

      // registryUrl ?
      if (cheEditorYaml.registryUrl) {
        repositoryEditorYamlUrl = `${cheEditorYaml.registryUrl}/plugins/${cheEditorYaml.id}/devfile.yaml`;
      } else {
        repositoryEditorYamlUrl = `${pluginRegistryUrl}/plugins/${cheEditorYaml.id}/devfile.yaml`;
      }
    } else if (cheEditorYaml.reference) {
      // load the content of this editor
      console.debug(`Loading editor from reference ${cheEditorYaml.reference}`);
      repositoryEditorYamlUrl = cheEditorYaml.reference;
    }
    if (repositoryEditorYamlUrl) {
      const response = await getEditor(repositoryEditorYamlUrl, dispatch, getState);
      if (response.content) {
        const yaml = load(response.content);
        repositoryEditorYaml = isDevfileV2(yaml) ? yaml : undefined;
      } else {
        throw new Error(response.error);
      }
    }

    // if there are some overrides, apply them
    if (cheEditorYaml.override) {
      console.debug(`Applying overrides ${JSON.stringify(cheEditorYaml.override)}...`);
      cheEditorYaml.override.containers?.forEach(container => {
        // search matching component
        const matchingComponent = repositoryEditorYaml?.components
          ? repositoryEditorYaml.components.find(component => component.name === container.name)
          : undefined;
        if (matchingComponent?.container) {
          // apply overrides except the name
          Object.keys(container).forEach(property => {
            if (matchingComponent.container?.[property] && property !== 'name') {
              console.debug(
                `Updating property from ${matchingComponent.container[property]} to ${container[property]}`,
              );
              matchingComponent.container[property] = container[property];
            }
          });
        }
      });
    }

    if (!repositoryEditorYaml) {
      throw new Error(
        'Failed to analyze the editor devfile inside the repository, reason: Missing id, reference or inline content.',
      );
    }
    // Use the repository defined editor
    editorsDevfile = repositoryEditorYaml;
  }

  if (editorsDevfile) {
    if (!editorsDevfile.metadata || !editorsDevfile.metadata.name) {
      throw new Error(
        'Failed to analyze the editor devfile, reason: Missing metadata.name attribute in the editor yaml file.',
      );
    }
    return dump(editorsDevfile);
  }

  return undefined;
}
