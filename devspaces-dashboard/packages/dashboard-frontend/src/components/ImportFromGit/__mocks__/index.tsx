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

import { Props } from '@/components/ImportFromGit';

export default class ImportFromGit extends React.PureComponent<Props> {
  public render() {
    return (
      <div data-testid="import-from-git">
        <div>Import from Git</div>
        <div data-testid="editor-definition">
          {this.props.editorDefinition ? this.props.editorDefinition : ''}
        </div>
        <div data-testid="editor-image">{this.props.editorImage ? this.props.editorImage : ''}</div>
      </div>
    );
  }
}
