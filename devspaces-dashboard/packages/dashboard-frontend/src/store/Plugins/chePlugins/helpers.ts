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

import devfileApi from '@/services/devfileApi';
import { che } from '@/services/models';

/** Convert devfile to editor plugin */
export function convertToEditorPlugin(editor: devfileApi.Devfile): che.Plugin {
  if (
    !editor.metadata?.name ||
    !editor.metadata.attributes?.version ||
    !editor.metadata.attributes?.publisher
  ) {
    throw new Error('Invalid editor metadata');
  }
  return {
    id:
      editor.metadata.attributes.publisher +
      '/' +
      editor.metadata.name +
      '/' +
      editor.metadata.attributes.version,
    name: editor.metadata.name,
    description: editor.metadata.description,
    displayName: editor.metadata.displayName,
    publisher: editor.metadata.attributes.publisher,
    type: 'Che Editor',
    tags: editor.metadata.tags,
    version: editor.metadata.attributes.version,
    links: {
      devfile: '',
    },
    icon: editor.metadata.attributes.iconData,
    iconMediatype: editor.metadata.attributes.iconMediatype,
  };
}
