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

import { Button } from '@patternfly/react-core';
import React from 'react';
import { Props, State } from '..';

export class WorkspaceLogsViewerTools extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isExpanded: false,
    };
  }

  private handleToggle(): void {
    const isExpanded = !this.state.isExpanded;
    this.setState({ isExpanded });
    this.props.onToggle(isExpanded);
  }

  render(): React.ReactElement {
    return (
      <div>
        <Button onClick={() => this.props.onDownload()}>Download</Button>
        <Button onClick={() => this.handleToggle()}>Toggle Expand</Button>
      </div>
    );
  }
}
