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

export default class StepCheckExistingWorkspaces extends React.Component<Props, State> {
  render(): React.ReactElement {
    const { onNextStep, onRestart } = this.props;
    return (
      <div>
        <span>Step check existing workspaces</span>
        <button onClick={() => onRestart()}>Restart</button>
        <button onClick={() => onNextStep()}>Next step</button>
      </div>
    );
  }
}
