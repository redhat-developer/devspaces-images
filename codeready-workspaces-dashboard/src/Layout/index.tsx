/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
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
import { connect, ConnectedProps } from 'react-redux';
import { Page } from '@patternfly/react-core';
import { History } from 'history';
import { matchPath } from 'react-router';

import Header from './Header';
import Sidebar from './Sidebar';
import { ThemeVariant } from './themeVariant';
import { AppState } from '../store';
import { lazyInject } from '../inversify.config';
import { KeycloakAuthService } from '../services/keycloak/auth';
import { IssuesReporterService } from '../services/bootstrap/issuesReporter';
import { ErrorReporter } from './ErrorReporter';
import { IssueComponent } from './ErrorReporter/Issue';
import { BannerAlert } from '../components/BannerAlert';
import { ErrorBoundary } from './ErrorBoundary';
import { DisposableCollection } from '../services/helpers/disposable';
import { ROUTE } from '../route.enum';

const THEME_KEY = 'theme';
const IS_MANAGED_SIDEBAR = false;

type Props =
  MappedProps
  & {
    children: React.ReactNode;
    history: History;
  };
type State = {
  isSidebarVisible: boolean;
  isHeaderVisible: boolean;
  theme: ThemeVariant;
};

export class Layout extends React.PureComponent<Props, State> {

  @lazyInject(IssuesReporterService)
  private readonly issuesReporterService: IssuesReporterService;

  @lazyInject(KeycloakAuthService)
  private readonly keycloakAuthService: KeycloakAuthService;

  private readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    const theme: ThemeVariant = window.sessionStorage.getItem(THEME_KEY) as ThemeVariant || ThemeVariant.DARK;

    this.state = {
      isHeaderVisible: true,
      isSidebarVisible: true,
      theme,
    };
  }

  private logout(): void {
    this.keycloakAuthService.logout();
  }

  private toggleNav(): void {
    this.setState({
      isSidebarVisible: !this.state.isSidebarVisible,
    });
    window.postMessage('toggle-navbar', '*');
  }

  private changeTheme(theme: ThemeVariant): void {
    this.setState({ theme });
    window.sessionStorage.setItem(THEME_KEY, theme);
  }

  /**
   * Returns `true` if current location matches the IDE page path.
   */
  private testIdePath(): boolean {
    const currentPath = this.props.history.location.pathname;
    const match = matchPath(currentPath, {
      path: ROUTE.IDE_LOADER,
      exact: true,
      strict: false,
    });
    return match !== null;
  }

  public componentDidMount(): void {
    const handleMessage = (event: MessageEvent): void => {
      if (typeof event.data !== 'string') {
        return;
      }

      if (event.data === 'show-navbar') {
        this.setState({
          isSidebarVisible: true,
          isHeaderVisible: true,
        });
      } else if (event.data === 'hide-navbar') {
        const isHeaderVisible = !this.testIdePath() || document.getElementById('ide-iframe') === null;
        this.setState({
          isSidebarVisible: false,
          isHeaderVisible,
        });
      }
    };
    window.addEventListener('message', handleMessage, false);
    this.toDispose.push({
      dispose: () => {
        window.removeEventListener('message', handleMessage);
      },
    });
  }

  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  public render(): React.ReactElement {
    /* check for startup issues */
    if (this.issuesReporterService.hasIssue) {
      const issue = this.issuesReporterService.reportIssue();
      const brandingData = this.props.brandingStore.data;
      if (issue) {
        return (
          <ErrorReporter>
            <IssueComponent
              branding={brandingData}
              issue={issue}
            />
          </ErrorReporter>
        );
      }
    }

    const { isHeaderVisible, isSidebarVisible, theme } = this.state;
    const { history } = this.props;

    const user = this.props.userStore.user;
    const logoUrl = this.props.brandingStore.data.logoFile;

    return (
      <Page
        header={
          <Header
            history={history}
            isVisible={isHeaderVisible}
            logoUrl={logoUrl}
            user={user}
            logout={() => this.logout()}
            toggleNav={() => this.toggleNav()}
            changeTheme={theme => this.changeTheme(theme)}
          />
        }
        sidebar={
          <Sidebar
            isManaged={IS_MANAGED_SIDEBAR}
            isNavOpen={isSidebarVisible}
            history={history}
            theme={theme}
          />
        }
        isManagedSidebar={IS_MANAGED_SIDEBAR}
      >
        <ErrorBoundary>
          <BannerAlert />
          {this.props.children}
        </ErrorBoundary>
      </Page>
    );
  }

}

const mapStateToProps = (state: AppState) => ({
  brandingStore: state.branding,
  userStore: state.user,
});

const connector = connect(
  mapStateToProps
);

type MappedProps = ConnectedProps<typeof connector>
export default connector(Layout);
