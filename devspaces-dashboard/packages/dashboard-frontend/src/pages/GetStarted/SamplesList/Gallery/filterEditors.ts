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

import { PluginEditor } from '@/pages/GetStarted/SamplesList/Gallery';

/**
 * Filter the editors to leave the first occurrence of each editor name.
 */
export function filterMostPrioritized(editors: PluginEditor[]): PluginEditor[] {
  const editorNames = new Set();
  const filteredEditors = editors.filter(editor => {
    if (!editorNames.has(editor.name)) {
      editorNames.add(editor.name);
      return true;
    }
    return false;
  });

  return filteredEditors;
}

/**
 * Sort editors by name and version. The priority is defined as follows:
 * 1. Default editor
 * 2. Version insiders
 * 3. Version next
 * 4. Version latest
 * The rest of the editors are sorted by id.
 */
export function sortByPriority(editors: PluginEditor[]) {
  function sortFn(editorA: PluginEditor, editorB: PluginEditor) {
    const priority = ['isDefault', 'insiders', 'next', 'latest'];

    if (editorA.name === editorB.name) {
      for (const prop of priority) {
        if (editorA.version === prop) return -1;
        if (editorB.version === prop) return 1;
      }
    }
    return editorA.id.localeCompare(editorB.id);
  }

  return editors.sort(sortFn);
}
