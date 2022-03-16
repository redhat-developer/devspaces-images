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
import { Button } from '@patternfly/react-core';

type Props = {
  onConvert: () => Promise<void>;
};

type State = {
  isDisabled: boolean;
};

export default class WorkspaceConversionButton extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isDisabled: false,
    };
  }

  private async handleConversion(): Promise<void> {
    this.setState({
      isDisabled: true,
    });

    try {
      await this.props.onConvert();
      this.setState({
        isDisabled: false,
      });
    } catch (e) {
      this.setState({
        isDisabled: false,
      });
    }
  }

  render() {
    const { isDisabled } = this.state;
    return (
      <Button
        variant="warning"
        isDisabled={isDisabled}
        onClick={async () => await this.handleConversion()}
      >
        Convert
      </Button>
    );
  }
}
