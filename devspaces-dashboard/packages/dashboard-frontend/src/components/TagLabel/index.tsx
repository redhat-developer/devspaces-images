/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import { Label } from '@patternfly/react-core';

type Props = {
  version: string;
};

class TagLabel extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { version } = this.props;

    return (
      <Label
        variant="outline"
        color="blue"
        style={{
          backgroundColor: 'inherit',
          verticalAlign: 'top',
          fontSize: 'x-small',
          lineHeight: '12px',
          marginLeft: '5px',
          padding: '0 5px',
        }}
      >
        {version}
      </Label>
    );
  }
}

export default TagLabel;
