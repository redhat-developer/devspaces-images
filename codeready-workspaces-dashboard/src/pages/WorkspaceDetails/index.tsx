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

import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import {
  Alert,
  AlertActionCloseButton,
  AlertVariant,
  PageSection,
  PageSectionVariants,
  Tab,
  Tabs,
} from '@patternfly/react-core';
import Head from '../../components/Head';
import { WorkspaceDetailsTab, WorkspaceStatus } from '../../services/helpers/types';
import Header from './Header';
import CheProgress from '../../components/Progress';
import { AppState } from '../../store';
import { HeaderActionSelect } from './Header/Actions';
import { lazyInject } from '../../inversify.config';
import { AppAlerts } from '../../services/alerts/appAlerts';
import OverviewTab, { OverviewTab as Overview } from './OverviewTab';
import EditorTab, { EditorTab as Editor } from './EditorTab';
import { selectIsLoading, selectWorkspaceById } from '../../store/Workspaces/selectors';
import { History, UnregisterCallback } from 'history';

import './WorkspaceDetails.styl';
import { isWorkspaceV1, Workspace } from '../../services/workspaceAdapter';
import UnsavedChangesModal from '../../components/UnsavedChangesModal';

export const SECTION_THEME = PageSectionVariants.light;

type Props =
  {
    workspacesLink: string;
    onSave: (workspace: Workspace, activeTab: WorkspaceDetailsTab | undefined) => Promise<void>;
    history: History;
  } & MappedProps;

type State = {
  activeTabKey: WorkspaceDetailsTab;
  clickedTabIndex?: WorkspaceDetailsTab;
  hasWarningMessage?: boolean;
};

export class WorkspaceDetails extends React.PureComponent<Props, State> {
  private unregisterLocationCallback: UnregisterCallback;

  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  private alert: { variant?: AlertVariant; title?: string } = {};
  public showAlert: (variant: AlertVariant, title: string) => void;
  private readonly handleTabClick: (event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: React.ReactText) => void;

  private readonly editorTabPageRef: React.RefObject<Editor>;
  private readonly overviewTabPageRef: React.RefObject<Overview>;

  constructor(props: Props) {
    super(props);

    this.editorTabPageRef = React.createRef<Editor>();
    this.overviewTabPageRef = React.createRef<Overview>();

    this.state = {
      activeTabKey: this.getActiveTabKey(this.props.history.location.search),
      hasWarningMessage: false
    };

    // Toggle currently active tab
    this.handleTabClick = (event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: React.ReactText): void => {
      const searchParams = new window.URLSearchParams(this.props.history.location.search);
      const { clickedTabIndex } = this.state;
      this.setState({ clickedTabIndex: tabIndex as WorkspaceDetailsTab });
      const tab = clickedTabIndex && this.hasUnsavedChanges() ? clickedTabIndex : tabIndex as WorkspaceDetailsTab;
      searchParams.set('tab', tab);
      this.props.history.location.search = searchParams.toString();
      this.props.history.push(this.props.history.location);
    };

    this.showAlert = (variant: AlertVariant, title: string): void => {
      this.alert = { variant, title };
      const key = `wrks-details-${(('0000' + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4))}`;
      this.appAlerts.showAlert({ key, title, variant });
    };
  }

  private getActiveTabKey(search: History.Search): WorkspaceDetailsTab {
    if (search) {
      const searchParam = new URLSearchParams(search.substring(1));
      if (searchParam.has('tab') && searchParam.get('tab') === WorkspaceDetailsTab.DEVFILE) {
        return WorkspaceDetailsTab.DEVFILE;
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
      this.setState({ hasWarningMessage: false });
    }
  }

  private handleDiscardChanges(pathname: string): void {
    if (this.state.activeTabKey === WorkspaceDetailsTab.DEVFILE) {
      this.editorTabPageRef.current?.cancelChanges();
    } else if (this.state.activeTabKey === WorkspaceDetailsTab.OVERVIEW) {
      this.overviewTabPageRef.current?.cancelChanges();
    }

    if (pathname.startsWith('/workspace/')) {
      const tabIndex = this.state.clickedTabIndex;
      const searchParams = new window.URLSearchParams(this.props.history.location.search);
      searchParams.set('tab', tabIndex as WorkspaceDetailsTab);
      this.props.history.location.search = searchParams.toString();
      this.props.history.push(this.props.history.location);
    } else {
      this.props.history.push(pathname);
    }
  }

  private hasUnsavedChanges(): boolean {
    if (this.state.activeTabKey === WorkspaceDetailsTab.DEVFILE) {
      return this.editorTabPageRef.current?.state.hasChanges || !this.editorTabPageRef.current?.state.isDevfileValid;
    } else if (this.state.activeTabKey === WorkspaceDetailsTab.OVERVIEW) {
      return this.overviewTabPageRef.current?.hasChanges === true;
    }
    return false;
  }

  public render(): React.ReactElement {
    const { workspace, workspacesLink, history } = this.props;

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
          <HeaderActionSelect
            workspaceId={workspace.id}
            workspaceName={workspaceName}
            status={workspace.status}
            history={this.props.history} />
        </Header>
        <PageSection variant={SECTION_THEME} className='workspace-details-tabs'>
          {(this.state.hasWarningMessage) && (
            <Alert variant={AlertVariant.warning} isInline
              title={(<React.Fragment>
                The workspace <em>{workspaceName}&nbsp;</em> should be restarted to apply changes.
              </React.Fragment>)}
              actionClose={(<AlertActionCloseButton
                onClose={() => this.setState({ hasWarningMessage: false })} />)
              } />
          )}
          <Tabs activeKey={this.state.activeTabKey} onSelect={this.handleTabClick}>
            <Tab eventKey={WorkspaceDetailsTab.OVERVIEW} title={WorkspaceDetailsTab.OVERVIEW}>
              <CheProgress isLoading={this.props.isLoading} />
              <OverviewTab
                ref={this.overviewTabPageRef}
                workspace={workspace}
                onSave={workspace => this.onSave(workspace)}
              />
            </Tab>
            <Tab eventKey={WorkspaceDetailsTab.DEVFILE} title={WorkspaceDetailsTab.DEVFILE}>
              <CheProgress isLoading={this.props.isLoading} />
              <EditorTab
                ref={this.editorTabPageRef}
                workspace={workspace}
                onSave={workspace => this.onSave(workspace)}
                onDevWorkspaceWarning={() => this.setState({ hasWarningMessage: true })} />
            </Tab>
            {/* <Tab eventKey={WorkspaceDetailsTabs.Logs} title={WorkspaceDetailsTabs[WorkspaceDetailsTabs.Logs]}>*/}
            {/*  <LogsTab workspaceId={workspace.id} />*/}
            {/* </Tab>*/}
          </Tabs>
          <UnsavedChangesModal
            hasUnsavedChanges={() => this.hasUnsavedChanges()}
            onDiscardChanges={pathname => this.handleDiscardChanges(pathname)}
            history={history}
          />
        </PageSection>
      </React.Fragment>
    );
  }

  private async onSave(workspace: Workspace): Promise<void> {
    if (this.props.workspace && isWorkspaceV1((this.props.workspace as Workspace).ref)
      && (this.props.workspace.status !== WorkspaceStatus.STOPPED)) {
      this.setState({ hasWarningMessage: true });
    }
    await this.props.onSave(workspace, this.state.activeTabKey);
    this.editorTabPageRef.current?.cancelChanges();
  }

}

const mapStateToProps = (state: AppState) => ({
  isLoading: selectIsLoading(state),
  workspace: selectWorkspaceById(state),
});

const connector = connect(
  mapStateToProps,
  null,
  null,
  { forwardRef: true },
);

type MappedProps = ConnectedProps<typeof connector>
export default connector(WorkspaceDetails);
