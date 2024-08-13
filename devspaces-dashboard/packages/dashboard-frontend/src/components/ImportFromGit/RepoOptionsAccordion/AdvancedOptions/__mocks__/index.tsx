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

import { Props } from '@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions';

export class AdvancedOptions extends React.PureComponent<Props> {
  public render() {
    const {
      containerImage,
      temporaryStorage,
      createNewIfExisting,
      memoryLimit,
      cpuLimit,
      onChange,
    } = this.props;

    return (
      <div>
        <div>Advanced Options</div>
        <div data-testid="advanced-options">{`${containerImage}, ${temporaryStorage}, ${createNewIfExisting}, ${memoryLimit}, ${cpuLimit}`}</div>
        <button
          onClick={() =>
            onChange('newContainerImage', !temporaryStorage, !createNewIfExisting, 1073741824, 1)
          }
        >
          Advanced Options Change
        </button>
      </div>
    );
  }
}
