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

import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';

export type Props = {
  distance: -1 | 0 | 1 | undefined;
  title: string | undefined;
};

export class PureSubCondition extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { distance, title } = this.props;

    if (!title) {
      return <></>;
    }

    return (
      <ol className="pf-c-wizard__nav-list">
        <li className="pf-c-wizard__nav-item">
          <div className="pf-c-wizard__nav-link">
            <ProgressStepTitle distance={distance}>{title}</ProgressStepTitle>
          </div>
        </li>
      </ol>
    );
  }
}
