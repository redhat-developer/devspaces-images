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

import React from 'react';
import { Form, PageSection, PageSectionVariants } from '@patternfly/react-core';
import StorageTypeFormGroup from './StorageType';
import { WorkspaceNameFormGroup } from './WorkspaceName';
import InfrastructureNamespaceFormGroup from './InfrastructureNamespace';
import ProjectsFormGroup from './Projects';
import { constructWorkspace, Workspace } from '../../../services/workspace-adapter';
import { cloneDeep } from 'lodash';
import { DevWorkspaceStatus } from '../../../services/helpers/types';
import { StorageTypeTitle } from '../../../services/storageTypes';

type Props = {
  onSave: (workspace: Workspace) => Promise<void>;
  workspace: Workspace;
};

export type State = {
  storageType: che.WorkspaceStorageType;
  workspaceName: string;
};

export class OverviewTab extends React.Component<Props, State> {
  private readonly workspaceNameCallbacks: { cancelChanges?: () => void };
  private isWorkspaceNameChanged: boolean;

  constructor(props: Props) {
    super(props);

    const { workspace } = this.props;

    this.state = {
      storageType: workspace.storageType,
      workspaceName: workspace.name,
    };

    this.isWorkspaceNameChanged = false;
    this.workspaceNameCallbacks = {};
  }

  public componentDidUpdate(): void {
    const { storageType, workspaceName } = this.state;
    const workspace = this.props.workspace;

    if (storageType !== workspace.storageType || workspaceName !== workspace.name) {
      this.setState({
        storageType: workspace.storageType,
        workspaceName: workspace.name,
      });
    }
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
    if (this.props.workspace.isDevWorkspace) {
      return;
    }
    const workspaceClone = constructWorkspace(cloneDeep(this.props.workspace.ref));
    workspaceClone.name = workspaceName;
    await this.props.onSave(workspaceClone);
    this.setState({ workspaceName });
  }

  private async handleStorageSave(storageType: che.WorkspaceStorageType): Promise<void> {
    const workspaceClone = constructWorkspace(cloneDeep(this.props.workspace.ref));
    workspaceClone.storageType = storageType;
    await this.props.onSave(workspaceClone);
    this.setState({ storageType });
  }

  public render(): React.ReactElement {
    const { workspaceName, storageType } = this.state;
    const { workspace } = this.props;
    const namespace = workspace.namespace;
    const projects = workspace.projects;
    const isDeprecated = workspace.isDeprecated;

    return (
      <React.Fragment>
        <PageSection variant={PageSectionVariants.light}>
          <Form isHorizontal onSubmit={e => e.preventDefault()}>
            <WorkspaceNameFormGroup
              name={workspaceName}
              readonly={isDeprecated || workspace.isDevWorkspace}
              onSave={_workspaceName => this.handleWorkspaceNameSave(_workspaceName)}
              onChange={_workspaceName => {
                this.isWorkspaceNameChanged = workspaceName !== _workspaceName;
              }}
              callbacks={this.workspaceNameCallbacks}
            />
            <InfrastructureNamespaceFormGroup namespace={namespace} />
            <StorageTypeFormGroup
              readonly={isDeprecated || workspace.status === DevWorkspaceStatus.TERMINATING}
              storageType={StorageTypeTitle[storageType as che.WorkspaceStorageType] || storageType}
              onSave={_storageType => this.handleStorageSave(_storageType)}
            />
            <ProjectsFormGroup projects={projects} />
          </Form>
        </PageSection>
      </React.Fragment>
    );
  }
}

export default OverviewTab;
