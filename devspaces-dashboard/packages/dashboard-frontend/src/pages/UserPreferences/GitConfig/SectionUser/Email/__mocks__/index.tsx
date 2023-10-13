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

export class GitConfigUserEmail extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { onChange } = this.props;

    return <button onClick={() => onChange('new-user@che')}>Change Email</button>;
  }
}
