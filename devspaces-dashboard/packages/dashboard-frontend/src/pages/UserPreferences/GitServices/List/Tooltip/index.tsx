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

import { Button, Icon } from '@patternfly/react-core';
import { ExternalLinkSquareAltIcon, WarningTriangleIcon } from '@patternfly/react-icons';
import React from 'react';

import { CheTooltip } from '@/components/CheTooltip';

export type Props = {
  isVisible: boolean;
  serverURI: string;
};

export class GitServiceTooltip extends React.PureComponent<Props> {
  private handleClick(): void {
    window.open(this.props.serverURI, '_blank');
  }

  public render(): React.ReactElement {
    const { isVisible } = this.props;

    if (isVisible === false) {
      return <></>;
    }

    const content = (
      <span data-testid="tooltip-content">
        Provided API does not support the automatic token revocation. You can revoke it manually on
        &nbsp;
        <Button
          component="a"
          data-testid="tooltip-link"
          icon={<ExternalLinkSquareAltIcon />}
          iconPosition="right"
          isInline={true}
          variant="link"
          onClick={() => this.handleClick()}
        >
          {this.props.serverURI}
        </Button>
        .
      </span>
    );

    return (
      <Icon isInline={true} status="warning" data-testid="tooltip-icon">
        <CheTooltip content={content}>
          <WarningTriangleIcon />
        </CheTooltip>
      </Icon>
    );
  }
}
