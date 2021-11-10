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
import { Form, PageSection, PageSectionVariants } from '@patternfly/react-core';
import StorageTypeFormGroup from './StorageType';
import { WorkspaceNameFormGroup } from './WorkspaceName';
import InfrastructureNamespaceFormGroup from './InfrastructureNamespace';
import ProjectsFormGroup from './Projects';
import { convertWorkspace, Workspace } from '../../../services/workspace-adapter';
import devfileApi, { isDevWorkspace } from '../../../services/devfileApi';

type Props = {
  onSave: (workspace: Workspace) => Promise<void>;
  workspace: Workspace;
};

export type State = {
  storageType: che.WorkspaceStorageType;
  infrastructureNamespace: string;
  workspaceName: string;
};

export class OverviewTab extends React.Component<Props, State> {
  private isWorkspaceNameChanged = false;
  private workspaceNameCallbacks: { cancelChanges?: () => void } = {};

  constructor(props: Props) {
    super(props);

    const { workspace } = this.props;
    const storageType = workspace.storageType;
    const workspaceName = workspace.name;
    const infrastructureNamespace = workspace.namespace;

    this.state = {
      storageType,
      workspaceName,
      infrastructureNamespace,
    };
  }

  public get hasChanges() {
    return this.isWorkspaceNameChanged;
  }

  public cancelChanges(): void {
    if (this.workspaceNameCallbacks.cancelChanges) {
      this.workspaceNameCallbacks.cancelChanges();
    }
  }

  private async handleWorkspaceNameSave(workspaceName: string): Promise<void> {
    this.setState({ workspaceName });
    this.props.workspace.name = workspaceName;
    await this.onSave(this.props.workspace.devfile);
  }

  private async handleStorageSave(storageType: che.WorkspaceStorageType): Promise<void> {
    this.setState({ storageType });
    this.props.workspace.storageType = storageType;
    await this.onSave(this.props.workspace.devfile);
  }

  public render(): React.ReactElement {
    const storageType = this.props.workspace.storageType;
    const workspaceName = this.props.workspace.name;
    const namespace = this.state.infrastructureNamespace;
    const projects = this.props.workspace.projects;
    const readonly = isDevWorkspace(this.props.workspace.ref);

    return (
      <React.Fragment>
        <PageSection variant={PageSectionVariants.light}>
          <Form isHorizontal onSubmit={e => e.preventDefault()}>
            <WorkspaceNameFormGroup
              name={workspaceName}
              readonly={readonly}
              onSave={_workspaceName => this.handleWorkspaceNameSave(_workspaceName)}
              onChange={_workspaceName => {
                this.isWorkspaceNameChanged = workspaceName !== _workspaceName;
              }}
              callbacks={this.workspaceNameCallbacks}
            />
            <InfrastructureNamespaceFormGroup namespace={namespace} />
            <StorageTypeFormGroup
              readonly={readonly}
              storageType={storageType}
              onSave={_storageType => this.handleStorageSave(_storageType)}
            />
            <ProjectsFormGroup projects={projects} />
          </Form>
        </PageSection>
      </React.Fragment>
    );
  }

  private async onSave(devfile: che.WorkspaceDevfile | devfileApi.Devfile): Promise<void> {
    const workspaceCopy = convertWorkspace(this.props.workspace.ref);
    workspaceCopy.devfile = devfile;
    await this.props.onSave(workspaceCopy);
  }
}

export default OverviewTab;
