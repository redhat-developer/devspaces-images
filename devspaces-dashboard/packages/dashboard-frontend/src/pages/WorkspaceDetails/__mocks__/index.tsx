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

import React from 'react';

import { Props, State } from '..';

export const mockShowAlert = jest.fn();
export class WorkspaceDetails extends React.PureComponent<Props, State> {
  render() {
    if (!this.props.workspace) {
      return <div>Not found</div>;
    }
    const workspace = this.props.workspace;
    return (
      <div className="WorkspaceDetails">
        Workspace Details Page
        <div data-testid="props-is-loading">{this.props.isLoading}</div>
        <div data-testid="props-old-workspace-path">
          {this.props.oldWorkspaceLocation?.pathname}
        </div>
        <div data-testid="props-workspace-id">{this.props.workspace.id}</div>
        <div data-testid="props-workspace-name">{this.props.workspace.name}</div>
        <div data-testid="props-workspaces-link">{this.props.workspacesLink}</div>
        <button onClick={() => this.props.onSave(workspace)}>Save</button>
      </div>
    );
  }
}
