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

import { Props } from '@/pages/UserPreferences/GitServices/RevokeModal';

export class GitServicesRevokeModal extends React.PureComponent<Props> {
  render() {
    const { isOpen, onCancel, onRevoke } = this.props;
    return (
      <div data-testid="git-services-revoke-modal">
        <div>GitServicesRevokeModal</div>
        <div data-testid="revoke-modal-is-open">{isOpen ? 'open' : 'closed'}</div>
        <button onClick={onRevoke}>Revoke</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  }
}
