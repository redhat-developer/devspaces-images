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
import {
  Alert,
  AlertActionCloseButton,
  AlertVariant,
  Button,
  Modal,
  ModalVariant,
  PageSection,
  PageSectionVariants,
  Tab,
  Tabs,
  Text,
  TextContent,
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
import { History } from 'history';

import './WorkspaceDetails.styl';
import { isWorkspaceV1, Workspace } from '../../services/workspaceAdapter';

export const SECTION_THEME = PageSectionVariants.light;

type Props =
  {
    workspacesLink: string;
    onSave: (workspace: Workspace, activeTab: WorkspaceDetailsTab | undefined) => Promise<void>;
    history: History;
  } & MappedProps;

type State = {
  activeTabKey?: WorkspaceDetailsTab;
  clickedTabIndex?: WorkspaceDetailsTab;
  hasWarningMessage?: boolean;
  hasDiscardChangesMessage?: boolean;
};

export class WorkspaceDetails extends React.PureComponent<Props, State> {

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
      activeTabKey: this.getActiveTabKey(),
      hasWarningMessage: false,
      hasDiscardChangesMessage: false,
    };

    // Toggle currently active tab
    this.handleTabClick = (event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: React.ReactText): void => {
      const searchParams = new window.URLSearchParams(this.props.history.location.search);
      searchParams.set('tab', WorkspaceDetailsTab[tabIndex]);
      this.props.history.location.search = searchParams.toString();
      this.props.history.push(this.props.history.location);
      if ((this.state.activeTabKey === WorkspaceDetailsTab.Devfile && this.editorTabPageRef.current?.state.hasChanges) ||
        (this.state.activeTabKey === WorkspaceDetailsTab.Overview && this.overviewTabPageRef.current?.hasChanges) ||
        this.props.isLoading) {
        const focusedElement = (
          document.hasFocus() &&
          document.activeElement !== document.body &&
          document.activeElement !== document.documentElement &&
          document.activeElement
        ) || null;
        if (focusedElement) {
          (focusedElement as HTMLBaseElement).blur();
        }
        if (!this.props.isLoading) {
          this.setState({ hasDiscardChangesMessage: true, clickedTabIndex: tabIndex as WorkspaceDetailsTab });
        }
        return;
      }
      this.setState({
        hasDiscardChangesMessage: false,
        clickedTabIndex: tabIndex as WorkspaceDetailsTab,
        activeTabKey: tabIndex as WorkspaceDetailsTab
      });
    };

    this.showAlert = (variant: AlertVariant, title: string): void => {
      this.alert = { variant, title };
      const key = `wrks-details-${(('0000' + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4))}`;
      this.appAlerts.showAlert({
        key,
        title,
        variant,
      });
    };
  }

  private getActiveTabKey(): WorkspaceDetailsTab {
    const { search } = this.props.history.location;

    if (search) {
      const searchParam = new URLSearchParams(search.substring(1));
      if (searchParam.has('tab') && searchParam.get('tab') === WorkspaceDetailsTab[WorkspaceDetailsTab.Devfile]) {
        return WorkspaceDetailsTab.Devfile;
      }
    }

    return WorkspaceDetailsTab.Overview;
  }

  public componentDidUpdate(): void {
    const activeTabKey = this.getActiveTabKey();
    if (this.state.activeTabKey !== activeTabKey) {
      this.setState({ activeTabKey });
    }
    if (this.props.workspace && (WorkspaceStatus[this.props.workspace?.status] === WorkspaceStatus.STOPPED)) {
      this.setState({ hasWarningMessage: false });
    }
  }

  private handleDiscardChanges(): void {
    if (this.state.activeTabKey === WorkspaceDetailsTab.Devfile) {
      this.editorTabPageRef.current?.cancelChanges();
    } else if (this.state.activeTabKey === WorkspaceDetailsTab.Overview) {
      this.overviewTabPageRef.current?.cancelChanges();
    }

    const tabIndex = this.state.clickedTabIndex;
    this.setState({ hasDiscardChangesMessage: false, activeTabKey: tabIndex });
  }

  private handleCancelChanges(): void {
    this.setState({ hasDiscardChangesMessage: false });
  }

  public render(): React.ReactElement {
    const { workspace, workspacesLink } = this.props;

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
            <Tab eventKey={WorkspaceDetailsTab.Overview} title={WorkspaceDetailsTab[WorkspaceDetailsTab.Overview]}>
              <CheProgress isLoading={this.props.isLoading} />
              <OverviewTab
                ref={this.overviewTabPageRef}
                workspace={workspace}
                onSave={workspace => this.onSave(workspace)}
              />
            </Tab>
            <Tab eventKey={WorkspaceDetailsTab.Devfile} title={WorkspaceDetailsTab[WorkspaceDetailsTab.Devfile]}>
              <CheProgress isLoading={this.props.isLoading} />
              <EditorTab
                ref={this.editorTabPageRef}
                workspace={workspace}
                onSave={workspace => this.onSave(workspace)}
                onDevWorkspaceWarning={() => this.setState({
                  hasWarningMessage: true
                })} />
            </Tab>
            {/* <Tab eventKey={WorkspaceDetailsTabs.Logs} title={WorkspaceDetailsTabs[WorkspaceDetailsTabs.Logs]}>*/}
            {/*  <LogsTab workspaceId={workspace.id} />*/}
            {/* </Tab>*/}
          </Tabs>
          <Modal variant={ModalVariant.small} isOpen={this.state.hasDiscardChangesMessage}
            title="Unsaved Changes"
            onClose={() => this.handleCancelChanges()}
            actions={[
              <Button key="confirm" variant="primary" onClick={() => this.handleDiscardChanges()}>
                Discard Changes
              </Button>,
              <Button key="cancel" variant="secondary" onClick={() => this.handleCancelChanges()}>
                Cancel
              </Button>,
            ]}
          >
            <TextContent>
              <Text>
                You have unsaved changes. You may go ahead and discard all changes, or close this window and save them.
              </Text>
            </TextContent>
          </Modal>
        </PageSection>
      </React.Fragment>
    );
  }

  private async onSave(workspace: Workspace): Promise<void> {
    if (this.props.workspace && (WorkspaceStatus[this.props.workspace.status] !== WorkspaceStatus.STOPPED) && isWorkspaceV1((this.props.workspace as Workspace).ref)) {
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
