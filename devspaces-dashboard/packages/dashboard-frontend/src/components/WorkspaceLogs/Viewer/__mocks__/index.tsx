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

import * as React from 'react';

import { Props } from '..';

export class WorkspaceLogsViewer extends React.PureComponent<Props> {
  render() {
    const logs = this.props.logsData?.logs || '';
    return (
      <div data-testid="workspace-logs-viewer">
        {this.props.isExpanded ? <span>Expanded view:</span> : <span>Collapsed view:</span>}
        <span>{logs}</span>
      </div>
    );
  }
}
