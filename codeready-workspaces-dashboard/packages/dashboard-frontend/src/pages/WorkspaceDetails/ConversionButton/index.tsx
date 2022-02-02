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
import { Location, History } from 'history';
import { connect, ConnectedProps } from 'react-redux';
import { Button } from '@patternfly/react-core';
import common from '@eclipse-che/common';
import { isDevWorkspace } from '../../../services/devfileApi';
import { ORIGINAL_WORKSPACE_ID_ANNOTATION } from '../../../services/devfileApi/devWorkspace/metadata';
import { convertDevfileV1toDevfileV2 } from '../../../services/devfile/converters';
import { Workspace } from '../../../services/workspace-adapter';
import { AppState } from '../../../store';
import { selectDefaultNamespace } from '../../../store/InfrastructureNamespaces/selectors';
import {
  selectAllWorkspaces,
  selectWorkspaceByQualifiedName,
} from '../../../store/Workspaces/selectors';
import * as WorkspacesStore from '../../../store/Workspaces';
import * as DevWorkspacesStore from '../../../store/Workspaces/devWorkspaces';
import { buildDetailsLocation } from '../../../services/helpers/location';
import { WorkspaceDetailsTab } from '../../../services/helpers/types';
import { DEVWORKSPACE_METADATA_ANNOTATION } from '../../../services/workspace-client/devworkspace/devWorkspaceClient';

type Props = MappedProps & {
  history: History;
  oldWorkspace: Workspace;
  onError: (errorMessage: string) => void;
  cleanupError: () => void;
};

type State = {
  isDisabled: boolean;
};

export class WorkspaceConversionButton extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isDisabled: false,
    };
  }

  private async handleConversion(): Promise<void> {
    this.setState({
      isDisabled: true,
    });
    this.props.cleanupError();

    const { oldWorkspace } = this.props;

    try {
      const newWorkspaceLocation = await this.convert(oldWorkspace);
      this.setState({
        isDisabled: false,
      });
      this.props.history.replace(newWorkspaceLocation);
    } catch (e) {
      this.setState({
        isDisabled: false,
      });
      const errorMessage = common.helpers.errors.getMessage(e);
      this.props.onError(errorMessage);
    }
  }

  private async convert(oldWorkspace: Workspace): Promise<Location> {
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

    const newWorkspace = this.props.allWorkspaces.find(
      workspace => workspace.namespace === defaultNamespace && workspace.name === oldWorkspace.name,
    );

    if (!newWorkspace) {
      throw new Error('The new DevWorkspace has been created but cannot be obtained.');
    }

    // add 'converted' attribute to the old workspace
    // to be able to hide it on the Workspaces page
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    oldWorkspace.ref.attributes!.converted = new Date().toISOString();
    await this.props.updateWorkspace(oldWorkspace);

    // return the new workspace page location
    const nextLocation = buildDetailsLocation(newWorkspace, WorkspaceDetailsTab.DEVFILE);
    return nextLocation;
  }

  render() {
    const { isDisabled } = this.state;
    return (
      <Button
        variant="warning"
        isDisabled={isDisabled}
        onClick={async () => await this.handleConversion()}
      >
        Convert
      </Button>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  defaultNamespace: selectDefaultNamespace(state),
  workspaceByQualifiedName: selectWorkspaceByQualifiedName(state),
});

const connector = connect(mapStateToProps, {
  ...WorkspacesStore.actionCreators,
  updateWorkspaceAnnotation: DevWorkspacesStore.actionCreators.updateWorkspaceAnnotation,
});

type MappedProps = ConnectedProps<typeof connector>;
export default connector(WorkspaceConversionButton);
