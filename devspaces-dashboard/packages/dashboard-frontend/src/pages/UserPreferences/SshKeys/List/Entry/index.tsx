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

import { api } from '@eclipse-che/common';
import {
  Button,
  Card,
  CardActions,
  CardFooter,
  CardHeader,
  CardTitle,
  Dropdown,
  DropdownItem,
  KebabToggle,
  Text,
  TextContent,
  TextVariants,
  Tooltip,
} from '@patternfly/react-core';
import { CopyIcon } from '@patternfly/react-icons';
import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import { getFormattedDate } from '@/services/helpers/dates';

export type Props = {
  sshKey: api.SshKey;
  onDeleteSshKey: (sshKey: api.SshKey) => void;
};
export type State = {
  isCopyTimerId: number | undefined;
  isOpenDropdown: boolean;
};

export class SshKeysListEntry extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isCopyTimerId: undefined,
      isOpenDropdown: false,
    };
  }

  private handleOpenDropdown(isOpen: boolean): void {
    this.setState({ isOpenDropdown: isOpen });
  }

  private handleDeleteEntry(sskKey: api.SshKey): void {
    this.props.onDeleteSshKey(sskKey);
  }

  private handleCopyToClipboard(): void {
    const { isCopyTimerId } = this.state;

    if (isCopyTimerId !== undefined) {
      clearTimeout(isCopyTimerId);
    }

    const nextTimerId = window.setTimeout(() => {
      this.setState({
        isCopyTimerId: undefined,
      });
    }, 3000);

    this.setState({
      isCopyTimerId: nextTimerId,
    });
  }

  render(): React.ReactNode {
    const { sshKey } = this.props;
    const { isCopyTimerId, isOpenDropdown } = this.state;

    const publicKey = atob(sshKey.keyPub);
    const addedOn = getFormattedDate(sshKey.creationTimestamp);

    const dropdownItems = [
      <DropdownItem key="action" component="button" onClick={() => this.handleDeleteEntry(sshKey)}>
        Delete
      </DropdownItem>,
    ];

    return (
      <Card key={sshKey.name}>
        <CardHeader>
          <CardTitle data-testid="title">{sshKey.name}</CardTitle>
          <CardActions>
            <Tooltip content={isCopyTimerId ? 'Copied!' : 'Copy to clipboard'}>
              <CopyToClipboard text={publicKey} onCopy={() => this.handleCopyToClipboard()}>
                <Button
                  variant="link"
                  icon={<CopyIcon />}
                  name="Copy to Clipboard"
                  data-testid="copy-to-clipboard"
                />
              </CopyToClipboard>
            </Tooltip>
            <Dropdown
              toggle={<KebabToggle onToggle={isOpen => this.handleOpenDropdown(isOpen)} />}
              isOpen={isOpenDropdown}
              isPlain
              dropdownItems={dropdownItems}
              position={'right'}
            />
          </CardActions>
        </CardHeader>
        <CardFooter>
          <TextContent>
            <Text component={TextVariants.small} data-testid="added-on">
              Added: {addedOn}
            </Text>
          </TextContent>
        </CardFooter>
      </Card>
    );
  }
}
