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

import { AlertVariant } from '@patternfly/react-core';
import { History } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import WorkspaceDetails, { WorkspaceDetails as Details } from '../pages/WorkspaceDetails';
import common from '@eclipse-che/common';
import {
  buildDetailsLocation,
  toHref,
  buildWorkspacesLocation,
} from '../services/helpers/location';
import { WorkspaceDetailsTab } from '../services/helpers/types';
import { Workspace } from '../services/workspace-adapter';
import { AppState } from '../store';
import * as WorkspacesStore from '../store/Workspaces';
import {
  selectAllWorkspaces,
  selectIsLoading,
  selectWorkspaceById,
} from '../store/Workspaces/selectors';

type Props = MappedProps & { history: History } & RouteComponentProps<{
    namespace: string;
    workspaceName: string;
  }>; // incoming parameters

class WorkspaceDetailsContainer extends React.Component<Props> {
  private workspacesLink: string;
  private workspaceDetailsPageRef: React.RefObject<Details>;
  private showAlert: (title: string, variant?: AlertVariant) => void;

  constructor(props: Props) {
    super(props);

    this.workspacesLink = toHref(this.props.history, buildWorkspacesLocation());
    this.workspaceDetailsPageRef = React.createRef<Details>();

    const namespace = this.props.match.params.namespace;
    const workspaceName = this.props.match.params.workspaceName.split('&')[0];
    if (workspaceName !== this.props.match.params.workspaceName) {
      const pathname = `/workspace/${namespace}/${workspaceName}`;
      this.props.history.replace({ pathname });
    }
  }

  private async init(): Promise<void> {
    const {
      match: { params },
      allWorkspaces,
      isLoading,
      requestWorkspaces,
      setWorkspaceId,
    } = this.props;
    let workspace = allWorkspaces.find(
      workspace =>
        workspace.namespace === params.namespace && workspace.name === params.workspaceName,
    );
    if (!isLoading && !workspace) {
      await requestWorkspaces();
      workspace = allWorkspaces?.find(
        workspace =>
          workspace.namespace === params.namespace && workspace.name === params.workspaceName,
      );
    }
    if (workspace) {
      setWorkspaceId(workspace.id);
    }
  }

  public componentDidMount(): void {
    this.init();
    const showAlert = this.workspaceDetailsPageRef.current?.showAlert;
    this.showAlert = (title: string, variant?: AlertVariant) => {
      if (showAlert) {
        showAlert(variant ? variant : AlertVariant.danger, title);
      } else {
        console.error(title);
      }
    };
  }

  public shouldComponentUpdate(nextProps: Props): boolean {
    return this.props.workspace?.id !== nextProps.workspace?.id;
  }

  public componentDidUpdate(): void {
    const namespace = this.props.match.params.namespace;
    const workspaceName = this.props.match.params.workspaceName;

    const workspace = this.props.allWorkspaces?.find(
      workspace => workspace.namespace === namespace && workspace.name === workspaceName,
    );
    if (workspace) {
      this.props.setWorkspaceId(workspace.id);
    }
    if (!workspace && !this.props.isLoading) {
      this.props.history.replace({ pathname: '/workspaces' });
    }
  }

  render() {
    return (
      <WorkspaceDetails
        ref={this.workspaceDetailsPageRef}
        workspacesLink={this.workspacesLink}
        onSave={(workspace: Workspace, activeTab?: WorkspaceDetailsTab) =>
          this.onSave(workspace, activeTab)
        }
        history={this.props.history}
      />
    );
  }

  async onSave(changedWorkspace: Workspace, activeTab?: WorkspaceDetailsTab): Promise<void> {
    try {
      await this.props.updateWorkspace(changedWorkspace);
      this.showAlert('Workspace has been updated', AlertVariant.success);

      const location = buildDetailsLocation(changedWorkspace, activeTab);
      this.props.setWorkspaceId(changedWorkspace.id);
      this.props.history.replace(location);
    } catch (e) {
      const errorMessage = common.helpers.errors.getMessage(e);
      if (
        this.workspaceDetailsPageRef.current?.state.activeTabKey === WorkspaceDetailsTab.DEVFILE
      ) {
        throw errorMessage;
      }
      this.showAlert(errorMessage);
    }
  }
}

const mapStateToProps = (state: AppState) => ({
  isLoading: selectIsLoading(state),
  allWorkspaces: selectAllWorkspaces(state),
  workspace: selectWorkspaceById(state),
});

const connector = connect(mapStateToProps, WorkspacesStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(WorkspaceDetailsContainer);
