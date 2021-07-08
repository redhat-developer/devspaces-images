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
import gravatarUrl from 'gravatar-url';
import {
  AlertVariant,
  ApplicationLauncher,
  ApplicationLauncherGroup,
  ApplicationLauncherItem,
  Avatar,
  Button,
  ButtonVariant,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  PageHeaderTools,
  PageHeaderToolsGroup,
  PageHeaderToolsItem
} from '@patternfly/react-core';
import { connect, ConnectedProps } from 'react-redux';
import { ROUTE } from '../../../route.enum';
import { lazyInject } from '../../../inversify.config';
import { AppAlerts } from '../../../services/alerts/appAlerts';
import { AlertItem } from '../../../services/helpers/types';
import { KeycloakAuthService } from '../../../services/keycloak/auth';
import { AppState } from '../../../store';
import * as InfrastructureNamespacesStore from '../../../store/InfrastructureNamespaces';
import { ThemeVariant } from '../../themeVariant';
import { QuestionCircleIcon } from '@patternfly/react-icons';
import { AboutModal } from './about-modal';
import { selectBranding } from '../../../store/Branding/selectors';
import { selectUserProfile } from '../../../store/UserProfile/selectors';

import './HeaderTools.styl';

type Props =
  MappedProps
  & {
    history: History;
    onCopyLoginCommand?: () => void;
    user: che.User | undefined;
    logout: () => void;
    changeTheme: (theme: ThemeVariant) => void;
  };
type State = {
  isUsernameDropdownOpen: boolean;
  isInfoDropdownOpen: boolean;
  isModalOpen: boolean;
};
export class HeaderTools extends React.PureComponent<Props, State> {

  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    this.state = {
      isUsernameDropdownOpen: false,
      isInfoDropdownOpen: false,
      isModalOpen: false,
    };
  }

  private onUsernameSelect(): void {
    this.setState({
      isUsernameDropdownOpen: !this.state.isUsernameDropdownOpen,
      isInfoDropdownOpen: false,
    });
  }

  private onUsernameButtonToggle(isOpen: boolean): void {
    this.setState({
      isUsernameDropdownOpen: isOpen,
      isInfoDropdownOpen: false,
    });
  }

  private setTheme(theme: ThemeVariant): void {
    this.props.changeTheme(theme);
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

  private getCliTool(): string {
    return this.props.branding.configuration.cheCliTool;
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

  private getEmail(): string {
    const { userProfile } = this.props;
    return userProfile ? userProfile.email : '';
  }

  private getLoginCommand(): string {
    const { keycloak, sso } = KeycloakAuthService;
    let loginCommand = this.getCliTool() + ` auth:login ${this.getHost()}`;
    if (!sso) {
      return loginCommand;
    }
    if (!keycloak) {
      throw new Error('Keycloak instance is undefined.');
    }
    if (!keycloak.refreshToken) {
      throw new Error('Refresh token is empty.');
    }
    loginCommand += ` -t ${keycloak.refreshToken}`;
    return loginCommand;
  }

  /**
   * Copies login command in clipboard.
   */
  private copyLoginCommand(): void {
    let loginCommand = '';
    try {
      loginCommand = this.getLoginCommand();
      const copyToClipboardEl = document.createElement('span');
      copyToClipboardEl.appendChild(document.createTextNode(loginCommand));
      const style = copyToClipboardEl.style;
      style.setProperty('position', 'absolute');
      style.setProperty('width', '1px');
      style.setProperty('height', '1px');
      style.setProperty('opacity', '0');
      const bodyEl = document.getElementsByTagName('body')[0];
      bodyEl.append(copyToClipboardEl);
      const range = document.createRange();
      range.selectNode(copyToClipboardEl);
      const selection = document.getSelection();
      if (!selection) {
        throw new Error('Document selection is empty.');
      }
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
      copyToClipboardEl.remove();
      this.showAlert({
        key: 'login-command-copied-to-clipboard',
        variant: AlertVariant.success,
        title: 'The login command copied to clipboard.',
      });
    } catch (e) {
      this.showAlert({
        key: 'login-command-copied-to-clipboard-failed',
        variant: AlertVariant.warning,
        title: `Failed to put login to clipboard. ${e}`,
      });
      if (loginCommand) {
        this.showAlert({
          key: 'login-command-info',
          variant: AlertVariant.info,
          title: 'Login command',
          children: (
            <React.Fragment>
              <Button variant={ButtonVariant.link} isInline={true}
                onClick={e => {
                  const target = e.target as Element;
                  target.classList.add('refresh-token-button-hidden');
                }}>
                Click here
              </Button>
              <span> to see the login command and copy it manually.</span>
              <pre className="refresh-token-area">{loginCommand}</pre>
            </React.Fragment>
          ),
        });
      }
    }
  }

  private async onCopyLoginCommand(): Promise<void> {
    const { onCopyLoginCommand } = this.props;
    if (onCopyLoginCommand) {
      onCopyLoginCommand();
    }
    // we need this request because of the token update as a side effect
    await this.props.requestNamespaces();
    this.copyLoginCommand();
  }

  private buildUserDropdownItems(): Array<React.ReactElement> {
    return [
      (
        <DropdownItem
          key='user-account'
          component='button'
          onClick={() => this.props.history.push(ROUTE.USER_ACCOUNT)}
        >
          Account
        </DropdownItem>
      ),
      (
        <DropdownItem
          key='user-preferences'
          component='button'
          onClick={() => this.props.history.push(ROUTE.USER_PREFERENCES)}
        >
          User Preferences
        </DropdownItem>
      ),
      (
        <DropdownItem
          key='copy-login-command'
          component='button'
          onClick={async () => await this.onCopyLoginCommand()}
        >
          {`Copy ${this.getCliTool()} login command`}
        </DropdownItem>
      ),
      (
        <DropdownItem
          key='account_logout'
          component='button'
          onClick={() => this.props.logout()}
        >
          Logout
        </DropdownItem>
      )
    ];
  }

  private buildUserToggleButton(): React.ReactElement {
    const username = this.getUsername();
    return (
      <DropdownToggle
        onToggle={(isOpen) => this.onUsernameButtonToggle(isOpen)}
      >
        {username}
      </DropdownToggle>
    );
  }

  private onInfoDropdownToggle() {
    this.setState({
      isInfoDropdownOpen: !this.state.isInfoDropdownOpen,
      isUsernameDropdownOpen: false,
    });
  }

  private buildInfoDropdownItems(): React.ReactNode[] {
    const branding = this.props.branding;
    const makeAWish = 'mailto:' + branding.supportEmail + '?subject=Wishes%20for%20';
    const faq = branding.docs.faq;
    const generalDocs = branding.docs.general;
    return [
      <ApplicationLauncherGroup key='info_button'>
        <ApplicationLauncherItem
          key='make_a_wish'
          isExternal={true}
          component='button'
          onClick={() => window.open(makeAWish, '_blank')}
        >
          Make a wish
        </ApplicationLauncherItem>
        <ApplicationLauncherItem
          key='documentation'
          isExternal={true}
          component='button'
          onClick={() => window.open(generalDocs, '_blank')}
        >
          Documentation
        </ApplicationLauncherItem>
        {faq && (
          <ApplicationLauncherItem
            key='faq'
            isExternal={true}
            onClick={() => window.open(faq, '_blank')}
            component='button'
          >
            FAQ
          </ApplicationLauncherItem>
        )}
        <ApplicationLauncherItem
          key='help'
          isExternal={true}
          component='button'
          onClick={() => window.open(branding.helpPath, '_target')}
        >
          {branding.helpTitle}
        </ApplicationLauncherItem>
        <ApplicationLauncherItem
          key='about'
          component='button'
          onClick={(e) => this.onAboutModal(e)}
        >
          About
        </ApplicationLauncherItem>
      </ApplicationLauncherGroup>,
    ];
  }

  private onAboutModal(e) {
    e.preventDefault();
    this.setState({
      isInfoDropdownOpen: false,
      isUsernameDropdownOpen: false,
      isModalOpen: true,
    });
  }

  private closeAboutModal() {
    this.setState({
      isInfoDropdownOpen: false,
      isUsernameDropdownOpen: false,
      isModalOpen: false,
    });
  }

  public render(): React.ReactElement {
    const {
      isUsernameDropdownOpen,
      isInfoDropdownOpen,
      isModalOpen,
    } = this.state;

    const userEmail = this.getEmail();
    const username = this.getUsername();
    const imageUrl = userEmail ? gravatarUrl(userEmail, { default: 'retro' }) : '';
    const isUserAuthenticated = !!userEmail;

    const branding = this.props.branding;
    return (
      <>
        <PageHeaderTools>
          <PageHeaderToolsGroup>
            <PageHeaderToolsItem>
              <ApplicationLauncher
                onToggle={() => this.onInfoDropdownToggle()}
                isOpen={isInfoDropdownOpen}
                items={this.buildInfoDropdownItems()}
                aria-label='info button'
                position='right'
                toggleIcon={<QuestionCircleIcon alt='' />}
              />
              {isUserAuthenticated &&
                <Dropdown
                  isPlain
                  position='right'
                  onSelect={() => this.onUsernameSelect()}
                  isOpen={isUsernameDropdownOpen}
                  toggle={this.buildUserToggleButton()}
                  dropdownItems={this.buildUserDropdownItems()}
                />}
            </PageHeaderToolsItem>
          </PageHeaderToolsGroup>
          {isUserAuthenticated &&
            <Avatar src={imageUrl} alt='Avatar image' />}
        </PageHeaderTools>
        <AboutModal
          isOpen={isModalOpen}
          closeAboutModal={() => this.closeAboutModal()}
          username={username}
          logo={branding.logoFile}
          productName={branding.name}
          productVersion={branding.productVersion}
        />
      </>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  userProfile: selectUserProfile(state),
  branding: selectBranding(state),
});

const connector = connect(
  mapStateToProps,
  InfrastructureNamespacesStore.actionCreators,
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(HeaderTools);
