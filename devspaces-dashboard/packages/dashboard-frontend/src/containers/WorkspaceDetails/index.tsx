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

import { History, Location } from 'history';
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
import { ORIGINAL_WORKSPACE_ID_ANNOTATION } from '../../services/devfileApi/devWorkspace/metadata';
import { DEVWORKSPACE_ID_OVERRIDE_ANNOTATION } from '../../services/devfileApi/devWorkspace/metadata';
import { convertDevfileV1toDevfileV2 } from '../../services/devfile/converters';
import { DEVWORKSPACE_METADATA_ANNOTATION } from '../../services/workspace-client/devworkspace/devWorkspaceClient';
import { selectDefaultNamespace } from '../../store/InfrastructureNamespaces/selectors';

type Props = MappedProps & { history: History } & RouteComponentProps<{
    namespace: string;
    workspaceName: string;
  }>; // incoming parameters

type State = {
  workspace?: Workspace;
};

class WorkspaceDetailsContainer extends React.Component<Props, State> {
  private workspacesLink: string;

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
    const oldWorkspaceId = workspace.ref.metadata.annotations?.[ORIGINAL_WORKSPACE_ID_ANNOTATION];
    if (!oldWorkspaceId) {
      return;
    }
    // check if the old workspace is still available
    const oldWorkspace = this.props.allWorkspaces.find(
      workspace => workspace.id === oldWorkspaceId,
    );
    if (!oldWorkspace) {
      return;
    }
    return buildDetailsLocation(oldWorkspace, WorkspaceDetailsTab.DEVFILE);
  }

  private getShowConvertButton(workspace?: Workspace): boolean {
    if (!workspace || isDevWorkspace(workspace.ref)) {
      return false;
    }
    const cheWorkspace = workspace.ref;
    if (!cheWorkspace.attributes?.convertedId) {
      return true;
    } else {
      const id = cheWorkspace.attributes.convertedId;
      return this.props.allWorkspaces.every(workspace => workspace.id !== id);
    }
  }

  public componentDidMount(): void {
    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    return (
      nextProps.isLoading === false &&
      (this.state.workspace?.id !== nextState.workspace?.id ||
        this.props.location.pathname !== nextProps.location.pathname)
    );
  }

  public componentDidUpdate(): void {
    const namespace = this.props.match.params.namespace;
    const workspaceName = this.props.match.params.workspaceName;

    const workspace = this.props.allWorkspaces.find(
      workspace => workspace.namespace === namespace && workspace.name === workspaceName,
    );
    this.setState({ workspace });
  }

  render() {
    const { workspace } = this.state;

    const oldWorkspaceLocation = this.getOldWorkspaceLocation(workspace);
    const showConvertButton = this.getShowConvertButton(workspace);

    return (
      <WorkspaceDetails
        history={this.props.history}
        isLoading={this.props.isLoading}
        oldWorkspaceLocation={oldWorkspaceLocation}
        showConvertButton={showConvertButton}
        workspace={workspace}
        workspacesLink={this.workspacesLink}
        onConvert={async (workspace: Workspace) => await this.handleConversion(workspace)}
        onSave={async (workspace: Workspace) => await this.onSave(workspace)}
      />
    );
  }

  async onSave(changedWorkspace: Workspace): Promise<void> {
    await this.props.updateWorkspace(changedWorkspace);
  }

  private async handleConversion(oldWorkspace: Workspace): Promise<void> {
    if (isDevWorkspace(oldWorkspace.ref)) {
      throw new Error('This workspace cannot be converted to DevWorkspaces.');
    }

    const devfileV1 = oldWorkspace.devfile as che.WorkspaceDevfile;
    const devfileV2 = await convertDevfileV1toDevfileV2(devfileV1);
    if (devfileV2.metadata.attributes === undefined) {
      devfileV2.metadata.attributes = {};
    }
    if (devfileV2.metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION] === undefined) {
      devfileV2.metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION] = {};
    }
    devfileV2.metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION][
      ORIGINAL_WORKSPACE_ID_ANNOTATION
    ] = oldWorkspace.id;
    devfileV2.metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION][
      DEVWORKSPACE_ID_OVERRIDE_ANNOTATION
    ] = oldWorkspace.id;
    const defaultNamespace = this.props.defaultNamespace.name;
    // create a new workspace
    await this.props.createWorkspaceFromDevfile(
      devfileV2,
      undefined,
      defaultNamespace,
      {},
      {},
      false,
    );

    const newWorkspace = this.props.allWorkspaces.find(workspace => {
      if (isDevWorkspace(workspace.ref)) {
        return (
          workspace.ref.metadata.annotations?.[ORIGINAL_WORKSPACE_ID_ANNOTATION] === oldWorkspace.id
        );
      }
      return false;
    });

    if (!newWorkspace) {
      throw new Error('The new DevWorkspace has been created but cannot be obtained.');
    }

    // add 'converted' attribute to the old workspace
    // to be able to hide it on the Workspaces page
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    oldWorkspace.ref.attributes!.convertedId = newWorkspace.id;
    await this.props.updateWorkspace(oldWorkspace);

    // return the new workspace page location
    const nextLocation = buildDetailsLocation(newWorkspace, WorkspaceDetailsTab.DEVFILE);
    this.props.history.replace(nextLocation);
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
