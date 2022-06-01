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

import { History } from 'history';
import React from 'react';
import {
  AlertVariant,
  Button,
  ButtonVariant,
  Dropdown,
  DropdownItem,
  DropdownToggle,
} from '@patternfly/react-core';
import { connect, ConnectedProps } from 'react-redux';
import { ROUTE } from '../../../../route.enum';
import { lazyInject } from '../../../../inversify.config';
import { AppAlerts } from '../../../../services/alerts/appAlerts';
import { AlertItem } from '../../../../services/helpers/types';
import * as InfrastructureNamespacesStore from '../../../../store/InfrastructureNamespaces';
import { BrandingData } from '../../../../services/bootstrap/branding.constant';

import * as styles from './index.module.css';

type Props = MappedProps & {
  branding: BrandingData;
  history: History;
  user: che.User | undefined;
  userProfile: api.che.user.Profile | undefined;
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

  private showAlert(alert: AlertItem): void {
    this.appAlerts.showAlert(alert);
  }

  private getHost(): string {
    const { user } = this.props;
    if (user && user.links) {
      const targetLink = user.links.find(link => link.rel === 'current_user');
      if (targetLink) {
        return new URL(targetLink.href).origin;
      }
    }
    return window.location.host;
  }

  private getUsername(): string {
    const { userProfile, user } = this.props;

    let username = '';

    if (userProfile && userProfile.attributes) {
      if (userProfile.attributes.firstName) {
        username += userProfile.attributes.firstName;
      }
      if (userProfile.attributes.lastName) {
        username += ' ' + userProfile.attributes.lastName;
      }
    }
    if (!username && user && user.name) {
      username += user.name;
    }

    return username;
  }

  private buildUserDropdownItems(): Array<React.ReactElement> {
    return [
      <DropdownItem
        key="user-account"
        component="button"
        onClick={() => this.props.history.push(ROUTE.USER_ACCOUNT)}
      >
        Account
      </DropdownItem>,
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
    const username = this.getUsername();
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
        position="right"
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
