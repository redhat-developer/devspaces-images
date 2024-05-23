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

import { History, Location } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { WorkspaceActionsDeleteConfirmation } from '@/contexts/WorkspaceActions/DeleteConfirmation';
import { lazyInject } from '@/inversify.config';
import { buildIdeLoaderLocation, toHref } from '@/services/helpers/location';
import { LoaderTab, WorkspaceAction } from '@/services/helpers/types';
import { TabManager } from '@/services/tabManager';
import { Workspace } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import * as WorkspacesStore from '@/store/Workspaces';
import { selectAllWorkspaces } from '@/store/Workspaces/selectors';

import { WantDelete, WorkspaceActionsContext } from '.';

type Deferred = {
  resolve: () => void;
  reject: () => void;
};

type Props = MappedProps & { history: History } & {
  children: React.ReactElement;
};

export type State = {
  toDelete: string[]; // UIDs
  wantDelete: WantDelete | undefined; // UIDs
  isOpen: boolean;
  deferred?: Deferred;
};

class WorkspaceActionsProvider extends React.Component<Props, State> {
  @lazyInject(TabManager)
  private readonly tabManager: TabManager;

  private deleting: Set<string> = new Set();

  constructor(props: Props) {
    super(props);

    this.state = {
      toDelete: [],
      wantDelete: undefined,
      isOpen: false,
    };
  }

  /**
   * open the action in a new tab for DevWorkspaces
   */
  private handleLocation(location: Location): void {
    const link = toHref(this.props.history, location);
    this.tabManager.open(link);
  }

  private async deleteWorkspace(workspace: Workspace): Promise<void> {
    if (this.deleting.has(workspace.uid)) {
      console.warn(`Workspace "${workspace.name}" is being deleted.`);
      return;
    }

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
    } catch (e) {
      this.deleting.delete(workspace.uid);
      this.setState({
        toDelete: Array.from(this.deleting),
      });
      throw e;
    }
  }

  /**
   * Performs an action on the given workspace
   */
  private async handleAction(action: WorkspaceAction, uid: string): Promise<void> {
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
        this.handleLocation(buildIdeLoaderLocation(workspace));
        break;
      }
      case WorkspaceAction.START_DEBUG_AND_OPEN_LOGS: {
        // todo: open a new tab with the DEBUG_WORKSPACE_START parameter instead
        await this.props.startWorkspace(workspace, {
          'debug-workspace-start': true,
        });
        this.handleLocation(buildIdeLoaderLocation(workspace, LoaderTab.Logs));
        break;
      }
      case WorkspaceAction.START_IN_BACKGROUND:
        {
          await this.props.startWorkspace(workspace);
        }
        break;
      case WorkspaceAction.STOP_WORKSPACE:
        {
          await this.props.stopWorkspace(workspace);
        }
        break;
      case WorkspaceAction.DELETE_WORKSPACE:
        {
          await this.deleteWorkspace(workspace);
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

  public async handleShowConfirmation(wantDelete: WantDelete): Promise<void> {
    let deferred: Deferred | undefined;
    const promise = new Promise<void>((resolve, reject) => {
      deferred = {
        resolve,
        reject,
      };
    });

    this.setState({
      isOpen: true,
      wantDelete,
      deferred,
    });

    return promise;
  }

  private handleAcceptConfirmation(): void {
    const { deferred } = this.state;
    deferred?.resolve();

    this.setState({
      isOpen: false,
      deferred,
    });
  }

  private handleDeclineConfirmation(): void {
    const { deferred } = this.state;
    deferred?.reject();

    this.setState({
      isOpen: false,
      deferred,
    });
  }

  public render(): React.ReactElement {
    const { isOpen, toDelete, wantDelete } = this.state;

    const confirmationDialog =
      wantDelete === undefined ? (
        <></>
      ) : (
        <WorkspaceActionsDeleteConfirmation
          isOpen={isOpen}
          wantDelete={wantDelete}
          onConfirm={() => this.handleAcceptConfirmation()}
          onClose={() => this.handleDeclineConfirmation()}
        />
      );

    return (
      <WorkspaceActionsContext.Provider
        value={{
          handleAction: (action, uid) => this.handleAction(action, uid),
          showConfirmation: (wantDelete: WantDelete) => this.handleShowConfirmation(wantDelete),
          toDelete,
        }}
      >
        {this.props.children}
        {confirmationDialog}
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
