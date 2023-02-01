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
import Head from '../../components/Head';
import { UserPreferencesTab } from '../../services/helpers/types';
import { ROUTE } from '../../Routes/routes';
import { AppState } from '../../store';
import { selectIsLoading } from '../../store/GitOauthConfig/selectors';
import { actionCreators } from '../../store/GitOauthConfig';

const ContainerRegistryList = React.lazy(() => import('./ContainerRegistriesTab'));
const GitServicesTab = React.lazy(() => import('./GitServicesTab'));

type Props = {
  history: History;
} & MappedProps;

type State = {
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
      const searchParam = new URLSearchParams(search.substring(1));
      if (pathname === ROUTE.USER_PREFERENCES && (searchParam.get('tab') as UserPreferencesTab)) {
        return searchParam.get('tab') as UserPreferencesTab;
      }
    }

    return 'container-registries';
  }

  private handleTabClick(
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    activeTabKey: React.ReactText,
  ): void {
    this.props.history.push(`${ROUTE.USER_PREFERENCES}?tab=${activeTabKey}`);

    this.setState({
      activeTabKey: activeTabKey as UserPreferencesTab,
    });

    if (activeTabKey === 'git-services') {
      if (!this.props.isLoading) {
        this.props.requestGitOauthConfig();
      }
    }
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
        >
          <Tab
            id="container-registries-tab"
            eventKey="container-registries"
            title="Container Registries"
          >
            <ContainerRegistryList />
          </Tab>
          <Tab id="git-services-tab" eventKey="git-services" title="Git Services">
            <GitServicesTab />
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
