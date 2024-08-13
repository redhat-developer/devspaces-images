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

import { Props } from '@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions/ContainerImageField';

export class ContainerImageField extends React.PureComponent<Props> {
  public render() {
    const { containerImage, onChange } = this.props;

    return (
      <div>
        <div>Container Image</div>
        <div data-testid="container-image">{containerImage}</div>
        <button onClick={() => onChange('new-container-image')}>Container Image Change</button>
      </div>
    );
  }
}
