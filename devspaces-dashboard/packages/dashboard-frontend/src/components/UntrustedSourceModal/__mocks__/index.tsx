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

import { Props } from '@/components/UntrustedSourceModal';

export default class UntrustedSourceModal extends React.PureComponent<Props> {
  render(): React.ReactNode {
    const { isOpen, onContinue, onClose } = this.props;
    if (isOpen === false) {
      return null;
    }

    return (
      <div>
        <span>UntrustedSourceModal</span>
        <button onClick={onContinue}>Continue</button>
        {onClose === undefined ? null : <button onClick={onClose}>Cancel</button>}
      </div>
    );
  }
}
