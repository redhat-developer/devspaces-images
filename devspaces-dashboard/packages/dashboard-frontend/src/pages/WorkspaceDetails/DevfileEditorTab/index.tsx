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
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertVariant,
  Button,
  Flex,
  FlexItem,
  Modal,
  ModalVariant,
  Text,
  TextContent,
} from '@patternfly/react-core';
import * as lodash from 'lodash';
import { load } from 'js-yaml';
import common from '@eclipse-che/common';
import DevfileEditor, { DevfileEditor as Editor } from '../../../components/DevfileEditor';
import EditorTools from '../../../components/EditorTools';
import { constructWorkspace, Workspace } from '../../../services/workspace-adapter';
import devfileApi, { isDevfileV2, isDevWorkspace } from '../../../services/devfileApi';
import {
  DEVWORKSPACE_NEXT_START_ANNOTATION,
  DevWorkspaceClient,
  DEVWORKSPACE_METADATA_ANNOTATION,
} from '../../../services/workspace-client/devworkspace/devWorkspaceClient';
import { container } from '../../../inversify.config';

import styles from './index.module.css';
import { DevWorkspaceStatus } from '../../../services/helpers/types';

export type Props = {
  onSave: (workspace: Workspace) => Promise<void>;
  workspace: Workspace;
  isRunning: boolean;
  onDevWorkspaceWarning: () => void;
  isReadonly?: boolean;
};

export type State = {
  devfile: devfileApi.Devfile;
  hasChanges: boolean;
  hasRequestErrors: boolean;
  currentRequestError: string;
  isDevfileValid: boolean;
  isExpanded: boolean;
  copied?: boolean;
  showDevfileV2ConfirmationModal: boolean;
  additionSchema?: { [key: string]: any };
};

export class DevfileEditorTab extends React.PureComponent<Props, State> {
  private originDevfile: devfileApi.Devfile | undefined;
  private readonly devfileEditorRef: React.RefObject<Editor>;
  private devworkspaceClient: DevWorkspaceClient;

  cancelChanges: () => void;

  constructor(props: Props) {
    super(props);
    this.devworkspaceClient = container.get(DevWorkspaceClient);

    const devfile = this.props.workspace.devfile;
    const additionSchema = this.getAdditionSchema(devfile);

    this.state = {
      devfile,
      hasChanges: false,
      isDevfileValid: true,
      hasRequestErrors: false,
      currentRequestError: '',
      isExpanded: false,
      showDevfileV2ConfirmationModal: false,
      additionSchema,
    };

    this.cancelChanges = (): void => {
      delete this.originDevfile;
      this.init();
    };

    this.devfileEditorRef = React.createRef<Editor>();
  }

  private getAdditionSchema(devfile: devfileApi.Devfile): { [key: string]: any } | undefined {
    return isDevfileV2(devfile)
      ? {
          properties: {
            metadata: {
              properties: {
                name: {
                  const: (devfile as devfileApi.Devfile).metadata.name,
                },
                namespace: {
                  const: (devfile as devfileApi.Devfile).metadata.namespace,
                },
              },
            },
          },
        }
      : undefined;
  }

  private init(): void {
    const devfile = Object.assign({}, this.props.workspace.devfile);

    // do not expose this attribute
    const attrs = devfile.attributes;
    if (attrs?.[DEVWORKSPACE_METADATA_ANNOTATION]) {
      delete attrs[DEVWORKSPACE_METADATA_ANNOTATION];
    }

    if (devfile && (!this.originDevfile || !this.areEqual(devfile, this.originDevfile))) {
      this.originDevfile = devfile;
      this.updateEditor(devfile);
      const additionSchema = this.getAdditionSchema(devfile);
      this.setState({
        hasRequestErrors: false,
        currentRequestError: '',
        hasChanges: false,
        additionSchema,
      });
    }
  }

  public componentDidMount(): void {
    this.init();
  }

  public componentDidUpdate(): void {
    this.init();
  }

  public render(): React.ReactElement {
    const originDevfile = this.props.workspace.devfile;
    const { devfile, additionSchema, isExpanded } = this.state;
    const isReadonly = this.props.isReadonly ? true : this.props.workspace.isDeprecated;
    const saveButtonDisabled =
      !this.state.hasChanges ||
      !this.state.isDevfileValid ||
      this.props.workspace.status === DevWorkspaceStatus.TERMINATING;
    const editorTabStyle = isExpanded ? styles.editorTabExpanded : styles.editorTab;
    const cancelButtonDisabled = !this.state.hasChanges && this.state.isDevfileValid;

    return (
      <React.Fragment>
        <br />
        {this.state.currentRequestError && (
          <Alert
            variant={AlertVariant.danger}
            isInline
            title={this.state.currentRequestError}
            actionClose={
              <AlertActionCloseButton onClose={() => this.setState({ currentRequestError: '' })} />
            }
          />
        )}
        {this.state.showDevfileV2ConfirmationModal && (
          <Modal
            variant={ModalVariant.small}
            isOpen={true}
            title="Restart Workspace"
            onClose={() => this.devfileV2ConfirmationCancellation()}
            actions={[
              <Button key="yes" variant="primary" onClick={() => this.saveDevfile()}>
                Yes
              </Button>,
              <Button
                key="no"
                variant="secondary"
                onClick={() => this.devfileV2ConfirmationCancellation()}
              >
                No
              </Button>,
            ]}
          >
            <TextContent>
              <Text>Would you like to restart the workspace with the changes?</Text>
            </TextContent>
          </Modal>
        )}
        <TextContent className={editorTabStyle}>
          {this.state.currentRequestError && this.state.isExpanded && (
            <AlertGroup isToast>
              <Alert
                variant={AlertVariant.danger}
                title={this.state.currentRequestError}
                actionClose={
                  <AlertActionCloseButton
                    onClose={() => this.setState({ currentRequestError: '' })}
                  />
                }
              />
            </AlertGroup>
          )}
          <EditorTools
            content={devfile}
            handleExpand={isExpanded => {
              this.setState({ isExpanded });
            }}
          />
          <DevfileEditor
            additionSchema={additionSchema}
            ref={this.devfileEditorRef}
            devfile={originDevfile}
            decorationPattern="location[ \t]*(.*)[ \t]*$"
            onChange={(newValue, isValid) => this.onDevfileChange(newValue, isValid)}
            isReadonly={isReadonly}
          />
          {isReadonly === false && (
            <Flex direction={{ default: 'column' }}>
              <FlexItem align={{ default: 'alignRight' }} className={styles.buttonsGroup}>
                <Button
                  onClick={() => this.onSave()}
                  variant="primary"
                  className={styles.saveButton}
                  isDisabled={saveButtonDisabled}
                >
                  Save
                </Button>
                <Button
                  onClick={() => this.cancelChanges()}
                  variant="secondary"
                  className={styles.cancelButton}
                  isDisabled={cancelButtonDisabled}
                >
                  Cancel
                </Button>
              </FlexItem>
            </Flex>
          )}
        </TextContent>
      </React.Fragment>
    );
  }

  /**
   * When a devfile v2 user does not allow the devworkspace to restart then store the configuration
   * in an annotation that will be used on next start
   */
  private async devfileV2ConfirmationCancellation() {
    const devfile = this.state.devfile as devfileApi.Devfile;
    if (!devfile) {
      return;
    }
    try {
      await this.checkForModifiedClusterDevWorkspace();
      const devworkspace = this.props.workspace.ref as devfileApi.DevWorkspace;
      const convertedDevWorkspace = constructWorkspace(devworkspace);
      convertedDevWorkspace.devfile = devfile;
      // Store the devfile in here
      (convertedDevWorkspace.ref as devfileApi.DevWorkspace).metadata.annotations = {
        [DEVWORKSPACE_NEXT_START_ANNOTATION]: JSON.stringify(
          convertedDevWorkspace.ref as devfileApi.DevWorkspace,
        ),
      };
      convertedDevWorkspace.ref.status = devworkspace.status;
      this.props.onDevWorkspaceWarning();
      this.props.onSave(convertedDevWorkspace);
      this.setState({
        showDevfileV2ConfirmationModal: false,
      });
    } catch (e) {
      const errorMessage = common.helpers.errors.getMessage(e);
      this.setState({
        hasChanges: true,
        hasRequestErrors: true,
        currentRequestError: errorMessage,
      });
    }
  }

  private updateEditor(devfile: che.WorkspaceDevfile | devfileApi.Devfile): void {
    if (!devfile) {
      return;
    }
    this.devfileEditorRef.current?.updateContent(devfile);
    this.setState({ isDevfileValid: true });
  }

  private onDevfileChange(newValue: string, isValid: boolean): void {
    this.setState({ isDevfileValid: isValid });
    if (!isValid) {
      this.setState({ hasChanges: false });
      return;
    }
    let devfile: devfileApi.Devfile;
    try {
      devfile = load(newValue) as devfileApi.Devfile;
    } catch (e) {
      console.error('Devfile parse error', e);
      return;
    }
    if (this.areEqual(this.props.workspace.devfile, devfile)) {
      this.setState({ hasChanges: false });
      return;
    }
    this.setState({
      devfile,
      hasChanges: true,
      hasRequestErrors: false,
    });
  }

  private async onSave(): Promise<void> {
    if (!this.props.workspace.isRunning) {
      await this.saveDevfile();
    } else {
      this.setState({
        showDevfileV2ConfirmationModal: true,
      });
    }
  }

  /**
   * Check to see if the current devworkspaces devfile and the cluster devworkspaces devfile are the same. If they
   * are not then throw an error
   */
  private async checkForModifiedClusterDevWorkspace(): Promise<void> {
    const currentDevWorkspace = this.props.workspace.ref as devfileApi.DevWorkspace;
    const clusterDevWorkspace = await this.devworkspaceClient.getWorkspaceByName(
      currentDevWorkspace.metadata.namespace,
      currentDevWorkspace.metadata.name,
    );
    if (!lodash.isEqual(clusterDevWorkspace.spec.template, currentDevWorkspace.spec.template)) {
      throw new Error(
        'Could not save devfile to cluster. The clusters devfile and the incoming devfile are different. Please reload the page to get an updated devfile.',
      );
    }
  }

  private async saveDevfile() {
    const devfile = this.state.devfile;
    if (!devfile) {
      return;
    }

    // restore the attribute
    const dwMetadataAnnotation =
      this.props.workspace.devfile.attributes?.[DEVWORKSPACE_METADATA_ANNOTATION];
    if (dwMetadataAnnotation) {
      if (!devfile.attributes) {
        devfile.attributes = {};
      }
      devfile.attributes[DEVWORKSPACE_METADATA_ANNOTATION] = dwMetadataAnnotation;
    } else if (devfile.attributes?.[DEVWORKSPACE_METADATA_ANNOTATION]) {
      delete devfile.attributes[DEVWORKSPACE_METADATA_ANNOTATION];
    }

    const workspaceCopy = constructWorkspace(this.props.workspace.ref);
    if (!devfile.metadata.name) {
      devfile.metadata.name = workspaceCopy.name;
    }
    if (isDevfileV2(devfile) && !devfile.metadata.namespace) {
      devfile.metadata.namespace = workspaceCopy.namespace;
    }

    workspaceCopy.devfile = devfile;
    this.setState({ hasChanges: false });
    try {
      if (isDevWorkspace(workspaceCopy.ref)) {
        await this.checkForModifiedClusterDevWorkspace();
        // We need to manually re-attach devworkspace id so that we can re-use it to re-add default plugins to the devworkspace custom resource
        const dw = this.props.workspace.ref as devfileApi.DevWorkspace;
        workspaceCopy.ref.status = dw.status;
        if (!this.props.isRunning && workspaceCopy.ref.spec.started) {
          workspaceCopy.ref.spec.started = false;
        }
      }
      await this.props.onSave(workspaceCopy);
    } catch (e) {
      const error = common.helpers.errors.getMessage(e).replace(/^Error: /gi, '');
      this.setState({
        hasChanges: true,
        hasRequestErrors: true,
        currentRequestError: error,
      });
    }
    this.setState({
      showDevfileV2ConfirmationModal: false,
    });
  }

  private sortKeysInObject(obj: devfileApi.Devfile): devfileApi.Devfile {
    return Object.keys(obj)
      .sort()
      .reduce((result: devfileApi.Devfile, key: string) => {
        result[key] = obj[key];
        return result;
      }, {} as devfileApi.Devfile);
  }

  private areEqual(a: devfileApi.Devfile, b: devfileApi.Devfile): boolean {
    return JSON.stringify(this.sortKeysInObject(a)) == JSON.stringify(this.sortKeysInObject(b));
  }
}

export default DevfileEditorTab;
