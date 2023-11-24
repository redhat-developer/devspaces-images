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

// mock for the EditorTools component
import React from 'react';

import { Props } from '@/components/EditorTools';

export default class EditorTools extends React.PureComponent<Props> {
  public render(): React.ReactNode {
    const { handleExpand } = this.props;
    return (
      <div>
        Mock Editor Tools
        <button onClick={() => handleExpand(true)}>Expand Editor</button>
      </div>
    );
  }
}
