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

import common from '@eclipse-che/common';
import {
  AlertVariant,
  Button,
  PageSection,
  PageSectionVariants,
  Tab,
  Tabs,
} from '@patternfly/react-core';
import { History, Location, UnregisterCallback } from 'history';
import React from 'react';
import { Link } from 'react-router-dom';

import Head from '@/components/Head';
import ProgressIndicator from '@/components/Progress';
import WorkspaceEvents from '@/components/WorkspaceEvents';
import WorkspaceLogs from '@/components/WorkspaceLogs';
import { lazyInject } from '@/inversify.config';
import { DevfileEditorTab } from '@/pages/WorkspaceDetails/DevfileEditorTab';
import Header from '@/pages/WorkspaceDetails/Header';
import { WorkspaceDetailsHeaderActions } from '@/pages/WorkspaceDetails/Header/Actions';
import styles from '@/pages/WorkspaceDetails/index.module.css';
import { OverviewTab } from '@/pages/WorkspaceDetails/OverviewTab';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { buildDetailsLocation } from '@/services/helpers/location';
import { WorkspaceDetailsTab } from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';

export const SECTION_THEME = PageSectionVariants.light;

export type Props = {
  history: History;
  isLoading: boolean;
  oldWorkspaceLocation?: Location;
  workspace: Workspace | undefined;
  workspacesLink: string;
  onSave: (workspace: Workspace) => Promise<void>;
};

export type State = {
  activeTabKey: WorkspaceDetailsTab;
  clickedTabIndex?: WorkspaceDetailsTab;
  showInlineAlertRestartWarning: boolean;
};

export class WorkspaceDetails extends React.PureComponent<Props, State> {
  private unregisterLocationCallback: UnregisterCallback;

  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  public showAlert: (variant: AlertVariant, title: string) => void;
  private readonly handleTabClick: (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: string | number,
  ) => void;

  private readonly overviewTabPageRef: React.RefObject<OverviewTab>;

  constructor(props: Props) {
    super(props);

    this.overviewTabPageRef = React.createRef<OverviewTab>();

    this.state = {
      activeTabKey: this.getActiveTabKey(this.props.history.location.search),
      showInlineAlertRestartWarning: false,
    };

    // Toggle currently active tab
    this.handleTabClick = (
      _event: React.MouseEvent<HTMLElement, MouseEvent>,
      tabIndex: React.ReactText,
    ): void => {
      const searchParams = new window.URLSearchParams(this.props.history.location.search);
      this.setState({ clickedTabIndex: tabIndex as WorkspaceDetailsTab });

      const tab = tabIndex as WorkspaceDetailsTab;
      searchParams.set('tab', tab);
      this.props.history.location.search = searchParams.toString();
      this.props.history.push(this.props.history.location);
    };

    this.showAlert = (variant: AlertVariant, title: string): void => {
      const key = `wrks-details-${(
        '0000' + ((Math.random() * Math.pow(36, 4)) << 0).toString(36)
      ).slice(-4)}`;
      this.appAlerts.showAlert({ key, title, variant });
    };
  }

  private handleCloseRestartWarning(): void {
    this.setState({
      showInlineAlertRestartWarning: false,
    });
  }

  private getActiveTabKey(search: History.Search): WorkspaceDetailsTab {
    if (search) {
      const searchParam = new URLSearchParams(search.substring(1));
      const tab = searchParam.get('tab') || '';
      switch (tab) {
        case WorkspaceDetailsTab.OVERVIEW:
          return WorkspaceDetailsTab.OVERVIEW;
        case WorkspaceDetailsTab.DEVFILE:
          return WorkspaceDetailsTab.DEVFILE;
        case WorkspaceDetailsTab.EVENTS:
          return WorkspaceDetailsTab.EVENTS;
        case WorkspaceDetailsTab.LOGS:
          return WorkspaceDetailsTab.LOGS;
      }
    }
    return WorkspaceDetailsTab.OVERVIEW;
  }

  public componentDidMount(): void {
    this.unregisterLocationCallback = this.props.history.listen(location => {
      const activeTabKey = this.getActiveTabKey(location.search);
      if (activeTabKey !== this.state.activeTabKey) {
        this.setState({ activeTabKey });
      }
    });
  }

  public componentWillUnmount() {
    if (this.unregisterLocationCallback) {
      this.unregisterLocationCallback();
    }
  }

  public componentDidUpdate(): void {
    if (this.props.workspace && this.props.workspace?.isStopped) {
      this.handleCloseRestartWarning();
    }
  }

  public render(): React.ReactElement {
    const { oldWorkspaceLocation, workspace, workspacesLink } = this.props;

    if (!workspace) {
      return <div>Workspace not found.</div>;
    }

    const workspaceName = workspace.name;

    return (
      <React.Fragment>
        <Head pageName={workspaceName} />
        <Header
          workspacesLink={workspacesLink}
          workspaceName={workspaceName}
          status={workspace.status}
        >
          {oldWorkspaceLocation && (
            <Button
              variant="link"
              component={props => <Link {...props} to={oldWorkspaceLocation} />}
            >
              Show Original Devfile
            </Button>
          )}
          <WorkspaceDetailsHeaderActions workspace={workspace} />
        </Header>
        <PageSection variant={SECTION_THEME} className={styles.workspaceDetailsTabs}>
          <Tabs activeKey={this.state.activeTabKey} onSelect={this.handleTabClick}>
            <Tab eventKey={WorkspaceDetailsTab.OVERVIEW} title={WorkspaceDetailsTab.OVERVIEW}>
              <ProgressIndicator isLoading={this.props.isLoading} />
              <OverviewTab
                ref={this.overviewTabPageRef}
                workspace={workspace}
                onSave={workspace => this.handleOnSave(workspace)}
              />
            </Tab>
            <Tab eventKey={WorkspaceDetailsTab.DEVFILE} title={WorkspaceDetailsTab.DEVFILE}>
              <ProgressIndicator isLoading={this.props.isLoading} />
              <DevfileEditorTab
                workspace={workspace}
                isActive={WorkspaceDetailsTab.DEVFILE === this.state.activeTabKey}
              />
            </Tab>
            <Tab eventKey={WorkspaceDetailsTab.LOGS} title={WorkspaceDetailsTab.LOGS}>
              <WorkspaceLogs workspaceUID={workspace.uid} />
            </Tab>
            <Tab eventKey={WorkspaceDetailsTab.EVENTS} title={WorkspaceDetailsTab.EVENTS}>
              <WorkspaceEvents workspaceUID={workspace.uid} />
            </Tab>
          </Tabs>
        </PageSection>
      </React.Fragment>
    );
  }

  private async handleOnSave(workspace: Workspace): Promise<void> {
    try {
      await this.props.onSave(workspace);
      this.showAlert(AlertVariant.success, 'Workspace has been updated');

      const location = buildDetailsLocation(workspace, this.state.activeTabKey);
      this.props.history.replace(location);
    } catch (e) {
      const errorMessage = common.helpers.errors.getMessage(e);
      if (this.state.activeTabKey === WorkspaceDetailsTab.DEVFILE) {
        throw errorMessage;
      }
      this.showAlert(AlertVariant.danger, errorMessage);
    }
  }
}
