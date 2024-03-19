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

import React from 'react';

import { Props } from '@/components/EditorSelector/Gallery/Entry';

export class EditorSelectorEntry extends React.PureComponent<Props> {
  public render() {
    const { selectedId, editorsGroup, groupName, onSelect } = this.props;
    return (
      <div data-testid="editor-selector-entry">
        <div data-testid="selected-editor-id">{selectedId}</div>
        <div data-testid="editor-group-name">{groupName}</div>
        {editorsGroup.map(editor => (
          <div key={editor.id} data-testid={editor.name + ' ' + editor.version}>
            <span>{editor.name}</span>
            <button onClick={() => onSelect(editor.id)}>
              Select {editor.name} {editor.version}
            </button>
          </div>
        ))}
      </div>
    );
  }
}
