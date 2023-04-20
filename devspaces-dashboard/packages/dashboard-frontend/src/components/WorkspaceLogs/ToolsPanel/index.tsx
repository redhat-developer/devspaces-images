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

import { Split, SplitItem } from '@patternfly/react-core';
import React from 'react';

import styles from './index.module.css';

type Props = {
  isExpanded: boolean;
  leftPart?: React.ReactNode;
  rightPart?: React.ReactNode;
};

export class WorkspaceLogsToolsPanel extends React.PureComponent<Props> {
  private getToolsRightPart(): React.ReactNode {
    const { rightPart } = this.props;
    return rightPart ? rightPart : null;
  }

  private getToolsLeftPart(): React.ReactNode {
    const { leftPart } = this.props;
    return leftPart ? leftPart : null;
  }

  render(): React.ReactElement {
    const expandedPaddingStyle = this.props.isExpanded ? styles.expandedPadding : '';

    return (
      <Split>
        <SplitItem>{this.getToolsLeftPart()}</SplitItem>
        <SplitItem isFilled />
        <SplitItem className={`${styles.alignCenter} ${expandedPaddingStyle}`}>
          {this.getToolsRightPart()}
        </SplitItem>
      </Split>
    );
  }
}
