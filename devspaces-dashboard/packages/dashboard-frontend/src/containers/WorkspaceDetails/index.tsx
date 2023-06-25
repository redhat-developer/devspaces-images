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

import { Location } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { WorkspaceDetails } from '../../pages/WorkspaceDetails';
import {
  buildDetailsLocation,
  toHref,
  buildWorkspacesLocation,
} from '../../services/helpers/location';
import { WorkspaceDetailsTab } from '../../services/helpers/types';
import { Workspace } from '../../services/workspace-adapter';
import { AppState } from '../../store';
import * as WorkspacesStore from '../../store/Workspaces';
import { selectAllWorkspaces, selectIsLoading } from '../../store/Workspaces/selectors';
import { isDevWorkspace } from '../../services/devfileApi';
import { DEVWORKSPACE_ID_OVERRIDE_ANNOTATION } from '../../services/devfileApi/devWorkspace/metadata';
import { selectDefaultNamespace } from '../../store/InfrastructureNamespaces/selectors';
import { isEqual } from 'lodash';

type Props = MappedProps &
  RouteComponentProps<{
    namespace: string;
    workspaceName: string;
  }>;

type State = {
  workspace?: Workspace;
};

class WorkspaceDetailsContainer extends React.Component<Props, State> {
  private readonly workspacesLink: string;

  constructor(props: Props) {
    super(props);

    this.workspacesLink = toHref(this.props.history, buildWorkspacesLocation());

    const namespace = this.props.match.params.namespace;
    const workspaceName = this.props.match.params.workspaceName.split('&')[0];
    if (workspaceName !== this.props.match.params.workspaceName) {
      const pathname = `/workspace/${namespace}/${workspaceName}`;
      this.props.history.replace({ pathname });
    }

    this.state = {
      workspace: undefined,
    };
  }

  private async init(): Promise<void> {
    const {
      match: { params },
      allWorkspaces,
      isLoading,
      requestWorkspaces,
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
    this.setState({ workspace });
  }

  private getOldWorkspaceLocation(workspace?: Workspace): Location | undefined {
    if (!workspace || !isDevWorkspace(workspace.ref)) {
      return;
    }

    const che7WorkspaceId =
      workspace.ref.metadata.annotations?.[DEVWORKSPACE_ID_OVERRIDE_ANNOTATION];
    if (!che7WorkspaceId) {
      return;
    }
    // check if the old workspace is still available
    const che7Workspace = this.props.allWorkspaces.find(
      workspace => workspace.uid === che7WorkspaceId,
    );
    if (!che7Workspace) {
      return;
    }
    return buildDetailsLocation(che7Workspace, WorkspaceDetailsTab.DEVFILE);
  }

  public componentDidMount(): void {
    this.init();
  }

  public componentDidUpdate(prevProps: Props): void {
    const namespace = this.props.match.params.namespace;
    const workspaceName = this.props.match.params.workspaceName;
    const workspace = this.props.allWorkspaces.find(
      workspace => workspace.namespace === namespace && workspace.name === workspaceName,
    );
    if (!workspace) {
      const workspacesListLocation = buildWorkspacesLocation();
      this.props.history.push(workspacesListLocation);
    } else if (
      this.props.location.pathname !== prevProps.location.pathname ||
      !isEqual(workspace, this.state.workspace)
    ) {
      this.setState({ workspace });
    }
  }

  render() {
    const { workspace } = this.state;

    const oldWorkspaceLocation = this.getOldWorkspaceLocation(workspace);

    return (
      <WorkspaceDetails
        history={this.props.history}
        isLoading={this.props.isLoading}
        oldWorkspaceLocation={oldWorkspaceLocation}
        workspace={workspace}
        workspacesLink={this.workspacesLink}
        onSave={async (workspace: Workspace) => await this.onSave(workspace)}
      />
    );
  }

  async onSave(changedWorkspace: Workspace): Promise<void> {
    await this.props.updateWorkspace(changedWorkspace);
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  defaultNamespace: selectDefaultNamespace(state),
  isLoading: selectIsLoading(state),
});

const connector = connect(mapStateToProps, WorkspacesStore.actionCreators, null, {
  forwardRef: true,
});

type MappedProps = ConnectedProps<typeof connector>;
export default connector(WorkspaceDetailsContainer);
