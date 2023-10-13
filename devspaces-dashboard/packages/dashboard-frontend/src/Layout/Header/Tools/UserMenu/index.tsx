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

import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import { History } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { lazyInject } from '@/inversify.config';
import { ROUTE } from '@/Routes/routes';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { BrandingData } from '@/services/bootstrap/branding.constant';
import * as InfrastructureNamespacesStore from '@/store/InfrastructureNamespaces';

type Props = MappedProps & {
  branding: BrandingData;
  history: History;
  username: string;
  logout: () => void;
};
type State = {
  isOpened: boolean;
};
export class UserMenu extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    this.state = {
      isOpened: false,
    };
  }

  private onUsernameSelect(): void {
    this.setState({
      isOpened: !this.state.isOpened,
    });
  }

  private onUsernameButtonToggle(isOpen: boolean): void {
    this.setState({
      isOpened: isOpen,
    });
  }

  private buildUserDropdownItems(): Array<React.ReactElement> {
    return [
      // temporary hidden, https://github.com/eclipse/che/issues/21595
      // <DropdownItem
      //   key="user-account"
      //   component="button"
      //   onClick={() => this.props.history.push(ROUTE.USER_ACCOUNT)}
      // >
      //   Account
      // </DropdownItem>,
      <DropdownItem
        key="user-preferences"
        component="button"
        onClick={() => this.props.history.push(ROUTE.USER_PREFERENCES)}
      >
        User Preferences
      </DropdownItem>,
      <DropdownItem key="account_logout" component="button" onClick={() => this.props.logout()}>
        Logout
      </DropdownItem>,
    ];
  }

  private buildUserToggleButton(): React.ReactElement {
    const username = this.props.username;
    return (
      <DropdownToggle onToggle={isOpen => this.onUsernameButtonToggle(isOpen)}>
        {username}
      </DropdownToggle>
    );
  }

  public render(): React.ReactElement {
    const { isOpened: isUsernameDropdownOpen } = this.state;

    return (
      <Dropdown
        isPlain
        position={DropdownPosition.right}
        onSelect={() => this.onUsernameSelect()}
        isOpen={isUsernameDropdownOpen}
        toggle={this.buildUserToggleButton()}
        dropdownItems={this.buildUserDropdownItems()}
      />
    );
  }
}

const mapStateToProps = () => ({});

const connector = connect(mapStateToProps, InfrastructureNamespacesStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(UserMenu);
