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

import { Props } from '@/components/EditorSelector/Definition';

export class EditorDefinition extends React.PureComponent<Props> {
  public render() {
    const { editorDefinition, editorImage, onChange } = this.props;

    return (
      <div data-testid="editor-definition-component">
        <div>Editor Definition</div>
        <div data-testid="editor-definition">{editorDefinition}</div>
        <div data-testid="editor-image">{editorImage}</div>
        <button onClick={() => onChange('some/editor/id', 'editor-image')}>
          Editor Definition Change
        </button>
      </div>
    );
  }
}
