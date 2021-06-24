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
import { Button, Form, PageSection, PageSectionVariants, } from '@patternfly/react-core';
import { AppState } from '../../../store';
import DevfileEditor, { DevfileEditor as Editor } from '../../../components/DevfileEditor';
import StorageTypeFormGroup from './StorageType';
import { WorkspaceNameFormGroup } from './WorkspaceName';
import DevfileSelectorFormGroup from './DevfileSelector';
import InfrastructureNamespaceFormGroup from './InfrastructureNamespace';
import { selectPreferredStorageType, selectWorkspacesSettings } from '../../../store/Workspaces/Settings/selectors';
import { attributesToType, updateDevfile } from '../../../services/storageTypes';
import { safeLoad } from 'js-yaml';
import { updateDevfileMetadata } from '../updateDevfileMetadata';

type Props = MappedProps
  & {
    onDevfile: (
      devfile: api.che.workspace.devfile.Devfile,
      InfrastructureNamespace: string | undefined,
      optionalFilesContent: { [fileName: string]: string } | undefined,
    ) => Promise<void>;
  };
type State = {
  storageType: che.WorkspaceStorageType;
  devfile: che.WorkspaceDevfile;
  namespace?: che.KubernetesNamespace;
  generateName?: string;
  workspaceName: string;
  isCreated: boolean;
};

export class CustomWorkspaceTab extends React.PureComponent<Props, State> {

  private devfileEditorRef: React.RefObject<Editor>;

  constructor(props: Props) {
    super(props);

    const devfile = this.buildInitialDevfile();
    const storageType = attributesToType(devfile.attributes);
    const workspaceName = devfile.metadata.name ? devfile.metadata.name : '';
    const generateName = !workspaceName ? devfile.metadata.generateName : '';
    this.state = { devfile, storageType, generateName, workspaceName, isCreated: false };
    this.devfileEditorRef = React.createRef<Editor>();
  }

  private buildInitialDevfile(generateName?: string): che.WorkspaceDevfile {
    const devfile = {
      apiVersion: '1.0.0',
      metadata: {
        generateName: generateName ? generateName : 'wksp-'
      },
    } as che.WorkspaceDevfile;

    return updateDevfile(devfile, this.props.preferredStorageType);
  }

  private handleInfrastructureNamespaceChange(namespace: che.KubernetesNamespace): void {
    this.setState({ namespace });
  }

  private handleWorkspaceNameChange(workspaceName: string, workspaceDevfile?: che.WorkspaceDevfile): void {
    const devfile = workspaceDevfile ? workspaceDevfile : this.state.devfile;
    if (!devfile) {
      return;
    }
    if (workspaceName) {
      devfile.metadata.name = workspaceName;
      delete devfile.metadata.generateName;
      const generateName = '';
      this.setState({ workspaceName, generateName });
    }
    this.setState({ devfile });
    this.updateEditor(devfile);
  }

  private handleStorageChange(storageType: che.WorkspaceStorageType, workspaceDevfile?: che.WorkspaceDevfile): void {
    const devfile = workspaceDevfile ? workspaceDevfile : this.state.devfile;
    if (!devfile) {
      return;
    }

    const newDevfile = updateDevfile(devfile, storageType);

    this.setState({
      storageType,
      devfile: newDevfile,
    });
    this.updateEditor(newDevfile);
  }

  private handleNewDevfile(devfileContent?: che.WorkspaceDevfile): void {
    let devfile: che.WorkspaceDevfile;
    if (!devfileContent) {
      devfile = this.buildInitialDevfile();
    } else if (
      devfileContent?.attributes?.persistVolumes === undefined &&
      devfileContent?.attributes?.asyncPersist === undefined &&
      this.props.preferredStorageType
    ) {
      devfile = updateDevfile(devfileContent, this.props.preferredStorageType);
    } else {
      devfile = devfileContent;
    }
    const { storageType, workspaceName } = this.state;

    if (workspaceName) {
      this.handleWorkspaceNameChange(workspaceName, devfile);
    }
    if (storageType) {
      this.handleStorageChange(storageType, devfile);
    }

    if (!workspaceName && !storageType) {
      this.setState({ devfile });
      this.updateEditor(devfile);
    }
  }

  private handleDevfileChange(newValue: string, isValid: boolean): void {
    if (!isValid) {
      return;
    }
    let devfile: che.WorkspaceDevfile;
    try {
      devfile = safeLoad(newValue);
    } catch (e) {
      console.error('Devfile parse error', e);
      return;
    }
    devfile = updateDevfileMetadata(devfile);
    this.setState({ devfile, isCreated: false });
    if (devfile?.attributes) {
      const storageType = attributesToType(devfile.attributes);
      if (storageType !== this.state.storageType) {
        this.setState({ storageType });
      }
    }
    const workspaceName = devfile?.metadata?.name || '';
    if (workspaceName !== this.state.workspaceName) {
      this.setState({ workspaceName });
    }
    const generateName = devfile?.metadata?.generateName;
    if (generateName !== this.state.generateName) {
      this.setState({ generateName });
    }
  }

  private updateEditor(devfile: che.WorkspaceDevfile): void {
    this.devfileEditorRef.current?.updateContent(devfile);
    this.setState({ isCreated: false });
  }

  private async handleCreate(): Promise<void> {
    this.setState({
      isCreated: true
    });
    try {
      const { devfile } = this.state;
      /* For the time being `optionalFilesContent` is `undefined`.
      Later, if we want to load related files (editor.yaml, che-theia-plugins.yaml) we need to expose
      such an information to a user, so they are able to review and apply their custom setting if needed.
      Note: `optionalFilesContent` is supported by factory flow, or create from sample where user input is not allowed. */
      await this.props.onDevfile(devfile, this.state.namespace?.name, undefined);
    } catch (e) {
      this.setState({
        isCreated: false,
      });
    }
  }

  public render(): React.ReactElement {
    const { devfile, storageType, generateName, workspaceName, isCreated } = this.state;
    return (
      <>
        <PageSection
          variant={PageSectionVariants.light}
        >
          <Form isHorizontal>
            <InfrastructureNamespaceFormGroup
              onChange={(_namespace: che.KubernetesNamespace) => this.handleInfrastructureNamespaceChange(_namespace)}
            />
            <WorkspaceNameFormGroup
              generateName={generateName}
              name={workspaceName}
              onChange={_name => this.handleWorkspaceNameChange(_name)}
            />
            <StorageTypeFormGroup
              storageType={storageType}
              onChange={_storageType => this.handleStorageChange(_storageType)}
            />
          </Form>
        </PageSection>
        <PageSection
          isFilled
          variant={PageSectionVariants.light}
        >
          <DevfileSelectorFormGroup
            onDevfile={devfile => this.handleNewDevfile(devfile)}
            onClear={() => this.handleNewDevfile()}
          />
        </PageSection>
        <PageSection
          className="workspace-details-editor"
          variant={PageSectionVariants.light}
        >
          <DevfileEditor
            ref={this.devfileEditorRef}
            devfile={devfile}
            decorationPattern="location[ \t]*(.*)[ \t]*$"
            onChange={(newValue, isValid) => this.handleDevfileChange(newValue, isValid)}
          />
        </PageSection>
        <PageSection variant={PageSectionVariants.light}>
          <Button
            variant="primary"
            onClick={() => this.handleCreate()}
            isDisabled={isCreated}
          >
            Create & Open
          </Button>
        </PageSection>
      </>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  workspacesSettings: selectWorkspacesSettings(state),
  preferredStorageType: selectPreferredStorageType(state),
});

const connector = connect(
  mapStateToProps,
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(CustomWorkspaceTab);
