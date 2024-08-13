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

import { Props } from '@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions/MemoryLimitField';

export class MemoryLimitField extends React.PureComponent<Props> {
  public render() {
    const { memoryLimit, onChange } = this.props;

    return (
      <div>
        <div>Memory Limit</div>
        <div data-testid="memory-limit">{memoryLimit.toString()}</div>
        <button onClick={() => onChange(1073741824)}>Memory Limit Change</button>
      </div>
    );
  }
}
