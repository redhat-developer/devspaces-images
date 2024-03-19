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

import { Props } from '@/components/EditorSelector';

export default class EditorSelector extends React.PureComponent<Props> {
  render() {
    const { onSelect } = this.props;
    return (
      <div data-testid="editor-selector">
        Editor Selector
        <button onClick={() => onSelect('some/editor/id', 'custom-editor-image')}>
          Select Editor
        </button>
      </div>
    );
  }
}
