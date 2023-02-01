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

import common from '@eclipse-che/common';
import React from 'react';
import { Props, State } from '..';
import devfileApi from '../../../../services/devfileApi';
import { Workspace } from '../../../../services/workspace-adapter';

export default class EditorTab extends React.PureComponent<Props, State> {
  cancelChanges: () => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      devfile: {} as devfileApi.Devfile,
      hasChanges: false,
      isDevfileValid: true,
      hasRequestErrors: false,
      currentRequestError: '',
      isExpanded: false,
      showDevfileV2ConfirmationModal: false,
    };

    this.cancelChanges = () => {
      // no-op
    };
  }

  async handleOnSave(workspace: Workspace) {
    try {
      await this.props.onSave(workspace);
    } catch (e) {
      this.setState({
        currentRequestError: common.helpers.errors.getMessage(e),
      });
    }
  }

  render() {
    return (
      <div>
        Fake Editor Tab
        <button onClick={() => this.handleOnSave(this.props.workspace)}>Save</button>
        <button onClick={() => this.props.onDevWorkspaceWarning()}>Warning</button>
        <span data-testid="current-request-error">{this.state.currentRequestError}</span>
      </div>
    );
  }
}
