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

import { DisposableCollection } from '../../../services/helpers/disposable';
import React from 'react';

export type Props = {
  timeLimitSec: number;
  onTimeout: () => void;
};

export class TimeLimit extends React.Component<Props> {
  private readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);
  }

  public async componentDidMount() {
    try {
      await this.waitForTimeout();
    } catch (e) {
      this.props.onTimeout();
    }
  }

  public componentWillUnmount() {
    this.toDispose.dispose();
  }

  private async waitForTimeout(): Promise<void> {
    const { timeLimitSec } = this.props;
    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject();
      }, timeLimitSec * 1000);

      this.toDispose.push({
        dispose: () => {
          window.clearTimeout(timeoutId);
          resolve();
        },
      });
    });
  }

  render() {
    return <React.Fragment />;
  }
}
