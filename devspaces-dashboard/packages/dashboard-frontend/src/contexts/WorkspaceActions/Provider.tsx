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

import {
  Button,
  ButtonVariant,
  Checkbox,
  Modal,
  ModalVariant,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { History, Location } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import {
  buildDetailsLocation,
  buildIdeLoaderLocation,
  buildWorkspacesLocation,
  toHref,
} from '@/services/helpers/location';
import { LoaderTab, WorkspaceAction, WorkspaceDetailsTab } from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import * as WorkspacesStore from '@/store/Workspaces';
import { selectAllWorkspaces } from '@/store/Workspaces/selectors';

import { WorkspaceActionsContext } from '.';

type Deferred = {
  resolve: () => void;
  reject: () => void;
};

type Props = MappedProps & { history: History } & {
  children: React.ReactElement;
};

type State = {
  toDelete: string[]; // UIDs
  wantDelete: string[]; // UIDs
  isOpen: boolean;
  isConfirmed: boolean;
  deferred?: Deferred;
};

export class WorkspaceActionsProvider extends React.Component<Props, State> {
  private deleting: Set<string> = new Set();

  constructor(props: Props) {
    super(props);

    this.state = {
      toDelete: [],
      wantDelete: [],
      isOpen: false,
      isConfirmed: false,
    };
  }

  /**
   * open the action in a new tab for DevWorkspaces
   */
  private async handleLocation(location: Location, workspace: Workspace): Promise<Location | void> {
    const link = toHref(this.props.history, location);
    window.open(link, workspace.uid);
  }

  private async deleteWorkspace(
    action: WorkspaceAction,
    workspace: Workspace,
  ): Promise<Location | void> {
    this.deleting.add(workspace.uid);
    this.setState({
      toDelete: Array.from(this.deleting),
    });

    try {
      await this.props.deleteWorkspace(workspace);
      this.deleting.delete(workspace.uid);
      this.setState({
        toDelete: Array.from(this.deleting),
      });
      return buildWorkspacesLocation();
    } catch (e) {
      this.deleting.delete(workspace.uid);
      this.setState({
        toDelete: Array.from(this.deleting),
      });
      console.error(`Action "${action}" failed with workspace "${workspace.name}". ${e}`);
    }
  }

  /**
   * Performs an action on the given workspace
   */
  private async handleAction(action: WorkspaceAction, uid: string): Promise<Location | void> {
    const workspace = this.props.allWorkspaces.find(workspace => uid === workspace.uid);

    if (!workspace) {
      console.warn(`Workspace not found, UID: ${uid}.`);
      return;
    }

    if (this.deleting.has(uid)) {
      console.warn(`Workspace "${workspace.name}" is being deleted.`);
      return;
    }

    switch (action) {
      case WorkspaceAction.OPEN_IDE: {
        return this.handleLocation(buildIdeLoaderLocation(workspace), workspace);
      }
      case WorkspaceAction.WORKSPACE_DETAILS: {
        return buildDetailsLocation(workspace, WorkspaceDetailsTab.DEVFILE);
      }
      case WorkspaceAction.START_DEBUG_AND_OPEN_LOGS: {
        await this.props.startWorkspace(workspace, {
          'debug-workspace-start': true,
        });
        return this.handleLocation(buildIdeLoaderLocation(workspace, LoaderTab.Logs), workspace);
      }
      case WorkspaceAction.START_IN_BACKGROUND:
        {
          try {
            await this.props.startWorkspace(workspace);
          } catch (e) {
            console.warn(e);
          }
        }
        break;
      case WorkspaceAction.STOP_WORKSPACE:
        {
          await this.props.stopWorkspace(workspace);
        }
        break;
      case WorkspaceAction.ADD_PROJECT:
        return buildDetailsLocation(workspace, WorkspaceDetailsTab.DEVFILE);
      case WorkspaceAction.DELETE_WORKSPACE:
        {
          await this.deleteWorkspace(action, workspace);
        }
        break;
      case WorkspaceAction.RESTART_WORKSPACE:
        {
          await this.props.restartWorkspace(workspace);
        }
        break;
      default:
        console.warn(`Unhandled action type: "${action}".`);
    }
  }

  public async showConfirmation(wantDelete: string[]): Promise<void> {
    let deferred: Deferred | undefined;
    const promise = new Promise<void>((resolve, reject) => {
      deferred = {
        resolve,
        reject,
      };
    });

    this.setState({
      isOpen: true,
      isConfirmed: false,
      wantDelete,
      deferred,
    });

    return promise;
  }

  private handleOnDelete(): void {
    this.state.deferred?.resolve();

    this.setState({
      isConfirmed: false,
      isOpen: false,
    });
  }

  private handleOnClose(): void {
    this.state.deferred?.reject();

    this.setState({
      isConfirmed: false,
      isOpen: false,
    });
  }

  private handleConfirmationChange(isConfirmed: boolean): void {
    this.setState({
      isConfirmed,
    });
  }

  public buildConfirmationWindow(): React.ReactElement {
    const { isOpen, isConfirmed, wantDelete } = this.state;

    let confirmationText: string;
    if (wantDelete.length === 1) {
      const workspaceName = wantDelete[0];
      if (workspaceName) {
        confirmationText = `Would you like to delete workspace "${workspaceName}"?`;
      } else {
        confirmationText = 'Would you like to delete selected workspace?';
      }
    } else {
      confirmationText = `Would you like to delete ${wantDelete.length} workspaces?`;
    }

    const body = (
      <TextContent>
        <Text component={TextVariants.p}>{confirmationText}</Text>
        <Checkbox
          style={{ margin: '0 0 0 0.4rem' }}
          data-testid="confirmation-checkbox"
          isChecked={this.state.isConfirmed}
          onChange={isChecked => this.handleConfirmationChange(isChecked)}
          id="confirmation-checkbox"
          label="I understand, this operation cannot be reverted."
        />
      </TextContent>
    );

    const footer = (
      <React.Fragment>
        <Button
          variant={ButtonVariant.danger}
          isDisabled={isConfirmed === false}
          data-testid="delete-workspace-button"
          onClick={() => this.handleOnDelete()}
        >
          Delete
        </Button>
        <Button
          variant={ButtonVariant.link}
          data-testid="cancel-workspace-button"
          onClick={() => this.handleOnClose()}
        >
          Cancel
        </Button>
      </React.Fragment>
    );

    return (
      <Modal
        title="Delete Workspace"
        titleIconVariant="warning"
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={() => this.handleOnClose()}
        aria-label="Delete workspaces confirmation window"
        footer={footer}
      >
        {body}
      </Modal>
    );
  }

  public render(): React.ReactElement {
    const { toDelete } = this.state;

    const confirmationWindow = this.buildConfirmationWindow();

    return (
      <WorkspaceActionsContext.Provider
        value={{
          handleAction: (action, uid) => this.handleAction(action, uid),
          showConfirmation: (wantDelete: string[]) => this.showConfirmation(wantDelete),
          toDelete,
        }}
      >
        {this.props.children}
        {confirmationWindow}
      </WorkspaceActionsContext.Provider>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
});

const connector = connect(mapStateToProps, WorkspacesStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(WorkspaceActionsProvider);
