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

import { PageSection, PageSectionVariants, Tab, Tabs, Title } from '@patternfly/react-core';
import { History } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import Head from '@/components/Head';
import ContainerRegistries from '@/pages/UserPreferences/ContainerRegistriesTab';
import GitConfig from '@/pages/UserPreferences/GitConfig';
import GitServicesTab from '@/pages/UserPreferences/GitServicesTab';
import PersonalAccessTokens from '@/pages/UserPreferences/PersonalAccessTokens';
import SshKeys from '@/pages/UserPreferences/SshKeys';
import { ROUTE } from '@/Routes/routes';
import { UserPreferencesTab } from '@/services/helpers/types';
import { AppState } from '@/store';
import { actionCreators } from '@/store/GitOauthConfig';
import { selectIsLoading } from '@/store/GitOauthConfig/selectors';

const CONTAINER_REGISTRIES_TAB: UserPreferencesTab = 'container-registries';
const GIT_SERVICES_TAB: UserPreferencesTab = 'git-services';
const PERSONAL_ACCESS_TOKENS_TAB: UserPreferencesTab = 'personal-access-tokens';
const GITCONFIG_TAB: UserPreferencesTab = 'gitconfig';
const SSH_KEYS_TAB: UserPreferencesTab = 'ssh-keys';

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
        (tab === CONTAINER_REGISTRIES_TAB ||
          tab === GITCONFIG_TAB ||
          tab === GIT_SERVICES_TAB ||
          tab === PERSONAL_ACCESS_TOKENS_TAB ||
          tab === SSH_KEYS_TAB)
      ) {
        return searchParam.get('tab') as UserPreferencesTab;
      }
    }

    return CONTAINER_REGISTRIES_TAB;
  }

  private handleTabClick(
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    activeTabKey: React.ReactText,
  ): void {
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
          <Tab eventKey={CONTAINER_REGISTRIES_TAB} title="Container Registries">
            <ContainerRegistries />
          </Tab>
          <Tab eventKey={GIT_SERVICES_TAB} title="Git Services">
            <GitServicesTab />
          </Tab>
          <Tab eventKey={PERSONAL_ACCESS_TOKENS_TAB} title="Personal Access Tokens">
            <PersonalAccessTokens />
          </Tab>
          <Tab eventKey={GITCONFIG_TAB} title="Gitconfig">
            <GitConfig />
          </Tab>
          <Tab eventKey={SSH_KEYS_TAB} title="SSH Keys">
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
