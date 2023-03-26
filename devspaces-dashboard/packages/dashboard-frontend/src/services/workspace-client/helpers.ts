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
import devfileApi from '../devfileApi';
import { load, dump } from 'js-yaml';
import { ICheEditorYaml } from './devworkspace/devWorkspaceClient';
import { CHE_EDITOR_YAML_PATH } from './';
import { AppState } from '../../store';
import { ThunkDispatch } from 'redux-thunk';
import { KnownAction } from '../../store/DevfileRegistries';
import { getEditor } from '../../store/DevfileRegistries/getEditor';

/**
 * Checks for HTTP 401 Unauthorized response status code
 */
export function isUnauthorized(response: unknown): boolean {
  return hasStatus(response, 401);
}

/**
 * Checks for HTTP 403 Forbidden
 */
export function isForbidden(response: unknown): boolean {
  return hasStatus(response, 403);
}

/**
 * Checks for HTTP 500 Internal Server Error
 */
export function isInternalServerError(response: unknown): boolean {
  return hasStatus(response, 500);
}

function hasStatus(response: unknown, _status: number): boolean {
  if (typeof response === 'string') {
    if (response.toLowerCase().includes(`http status ${_status}`)) {
      return true;
    }
  } else if (common.helpers.errors.isError(response)) {
    const str = response.message.toLowerCase();
    if (str.includes(`status code ${_status}`)) {
      return true;
    }
  } else if (typeof response === 'object' && response !== null) {
    const { status, statusCode } = response as { [propName: string]: string | number };
    if (statusCode == _status) {
      return true;
    } else if (status == _status) {
      return true;
    } else {
      try {
        const str = JSON.stringify(response).toLowerCase();
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
        repositoryEditorYaml = load(response.content);
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
