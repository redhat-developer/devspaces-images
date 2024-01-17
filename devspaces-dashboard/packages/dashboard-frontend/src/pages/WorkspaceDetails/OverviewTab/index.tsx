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

import { Form, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { cloneDeep } from 'lodash';
import React from 'react';

import { InfrastructureNamespaceFormGroup } from '@/pages/WorkspaceDetails/OverviewTab/InfrastructureNamespace';
import { ProjectsFormGroup } from '@/pages/WorkspaceDetails/OverviewTab/Projects';
import StorageTypeFormGroup from '@/pages/WorkspaceDetails/OverviewTab/StorageType';
import WorkspaceNameFormGroup from '@/pages/WorkspaceDetails/OverviewTab/WorkspaceName';
import { DevWorkspaceStatus } from '@/services/helpers/types';
import { che } from '@/services/models';
import { constructWorkspace, Workspace } from '@/services/workspace-adapter';

export type Props = {
  onSave: (workspace: Workspace) => Promise<void>;
  workspace: Workspace;
};

export type State = {
  storageType: che.WorkspaceStorageType;
};

export class OverviewTab extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { workspace } = this.props;

    this.state = {
      storageType: workspace.storageType,
    };
  }

  public componentDidUpdate(): void {
    const { storageType } = this.state;
    const workspace = this.props.workspace;

    if (storageType !== workspace.storageType) {
      this.setState({
        storageType: workspace.storageType,
      });
    }
  }

  private async handleStorageSave(storageType: che.WorkspaceStorageType): Promise<void> {
    const workspaceClone = constructWorkspace(cloneDeep(this.props.workspace.ref));
    workspaceClone.storageType = storageType;
    await this.props.onSave(workspaceClone);
    this.setState({ storageType });
  }

  public render(): React.ReactElement {
    const { storageType } = this.state;
    const { workspace } = this.props;
    const namespace = workspace.namespace;
    const projects = workspace.projects;
    const isDeprecated = workspace.isDeprecated;

    return (
      <React.Fragment>
        <PageSection variant={PageSectionVariants.light}>
          <Form isHorizontal onSubmit={e => e.preventDefault()}>
            <WorkspaceNameFormGroup workspace={workspace} />
            <InfrastructureNamespaceFormGroup namespace={namespace} />
            <StorageTypeFormGroup
              readonly={isDeprecated || workspace.status === DevWorkspaceStatus.TERMINATING}
              storageType={storageType}
              onSave={storageType => this.handleStorageSave(storageType)}
            />
            <ProjectsFormGroup projects={projects} />
          </Form>
        </PageSection>
      </React.Fragment>
    );
  }
}
