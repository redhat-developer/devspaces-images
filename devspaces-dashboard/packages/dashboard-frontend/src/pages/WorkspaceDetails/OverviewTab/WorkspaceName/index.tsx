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

import { ApplicationId } from '@eclipse-che/common';
import { Button, FormGroup } from '@patternfly/react-core';
import { ExternalLinkSquareAltIcon } from '@patternfly/react-icons';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import overviewStyles from '@/pages/WorkspaceDetails/OverviewTab/index.module.css';
import { Workspace, WorkspaceAdapter } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import { actionCreators } from '@/store/BannerAlert';
import { selectApplications } from '@/store/ClusterInfo/selectors';

export type Props = MappedProps & {
  workspace: Workspace;
};

class WorkspaceNameFormGroup extends React.PureComponent<Props> {
  private buildOpenShiftConsoleLink(): React.ReactElement | undefined {
    const { applications, workspace } = this.props;
    const clusterConsole = applications.find(app => app.id === ApplicationId.CLUSTER_CONSOLE);

    if (!clusterConsole) {
      return;
    }

    const devWorkspaceOpenShiftConsoleUrl = WorkspaceAdapter.buildClusterConsoleUrl(
      workspace.ref,
      clusterConsole.url,
    );

    return (
      <Button
        component="a"
        variant="link"
        href={devWorkspaceOpenShiftConsoleUrl}
        target="_blank"
        icon={<ExternalLinkSquareAltIcon />}
        iconPosition="right"
        isInline
      >
        {workspace.name}
      </Button>
    );
  }

  public render(): React.ReactNode {
    const workspaceName = this.buildOpenShiftConsoleLink() || this.props.workspace.name;
    return (
      <FormGroup label="Workspace">
        <span className={overviewStyles.readonly}>{workspaceName}</span>
      </FormGroup>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  applications: selectApplications(state),
});

const connector = connect(mapStateToProps, actionCreators);

type MappedProps = ConnectedProps<typeof connector>;

export default connector(WorkspaceNameFormGroup);
