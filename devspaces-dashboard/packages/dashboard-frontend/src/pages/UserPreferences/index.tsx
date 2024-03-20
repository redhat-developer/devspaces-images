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

import { PageSection, PageSectionVariants, Tab, Tabs, Title } from '@patternfly/react-core';
import { History } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import Head from '@/components/Head';
import ContainerRegistries from '@/pages/UserPreferences/ContainerRegistriesTab';
import GitConfig from '@/pages/UserPreferences/GitConfig';
import GitServices from '@/pages/UserPreferences/GitServices';
import PersonalAccessTokens from '@/pages/UserPreferences/PersonalAccessTokens';
import SshKeys from '@/pages/UserPreferences/SshKeys';
import { ROUTE } from '@/Routes/routes';
import { UserPreferencesTab } from '@/services/helpers/types';
import { AppState } from '@/store';
import { actionCreators } from '@/store/GitOauthConfig';
import { selectIsLoading } from '@/store/GitOauthConfig/selectors';

export type Props = {
  history: History;
} & MappedProps;

export type State = {
  activeTabKey: UserPreferencesTab;
};

export class UserPreferences extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const activeTabKey = this.getActiveTabKey();

    this.state = {
      activeTabKey,
    };
  }

  private getActiveTabKey(): UserPreferencesTab {
    const { pathname, search } = this.props.history.location;

    if (search) {
      const searchParam = new URLSearchParams(search);
      const tab = searchParam.get('tab');
      if (
        pathname === ROUTE.USER_PREFERENCES &&
        (tab === UserPreferencesTab.CONTAINER_REGISTRIES ||
          tab === UserPreferencesTab.GITCONFIG ||
          tab === UserPreferencesTab.GIT_SERVICES ||
          tab === UserPreferencesTab.PERSONAL_ACCESS_TOKENS ||
          tab === UserPreferencesTab.SSH_KEYS)
      ) {
        return searchParam.get('tab') as UserPreferencesTab;
      }
    }

    return UserPreferencesTab.CONTAINER_REGISTRIES;
  }

  private handleTabClick(
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    activeTabKey: string | number,
  ): void {
    event.stopPropagation();
    this.props.history.push(`${ROUTE.USER_PREFERENCES}?tab=${activeTabKey}`);

    this.setState({
      activeTabKey: activeTabKey as UserPreferencesTab,
    });
  }

  render(): React.ReactNode {
    const { activeTabKey } = this.state;

    return (
      <React.Fragment>
        <Head pageName="User Preferences" />
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel={'h1'}>User Preferences</Title>
        </PageSection>
        <Tabs
          id="user-preferences-tabs"
          style={{ backgroundColor: 'var(--pf-global--BackgroundColor--100)' }}
          activeKey={activeTabKey}
          onSelect={(event, tabKey) => this.handleTabClick(event, tabKey)}
          mountOnEnter={true}
          unmountOnExit={true}
        >
          <Tab eventKey={UserPreferencesTab.CONTAINER_REGISTRIES} title="Container Registries">
            <ContainerRegistries />
          </Tab>
          <Tab eventKey={UserPreferencesTab.GIT_SERVICES} title="Git Services">
            <GitServices />
          </Tab>
          <Tab eventKey={UserPreferencesTab.PERSONAL_ACCESS_TOKENS} title="Personal Access Tokens">
            <PersonalAccessTokens />
          </Tab>
          <Tab eventKey={UserPreferencesTab.GITCONFIG} title="Gitconfig">
            <GitConfig />
          </Tab>
          <Tab eventKey={UserPreferencesTab.SSH_KEYS} title="SSH Keys">
            <SshKeys />
          </Tab>
        </Tabs>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  isLoading: selectIsLoading(state),
});

const connector = connect(mapStateToProps, actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(UserPreferences);
