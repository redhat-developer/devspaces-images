/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
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
import { History } from 'history';
import { AppState } from '../store';
import { selectAllWorkspaces, selectIsLoading, } from '../store/Workspaces/selectors';
import * as WorkspacesStore from '../store/Workspaces';
import Fallback from '../components/Fallback';
import WorkspacesList from '../pages/WorkspacesList';
import WorkspaceActionsProvider from './WorkspaceActions';
import { WorkspaceActionsConsumer } from './WorkspaceActions/context';

type Props =
  MappedProps
  & { history: History };

export class WorkspacesListContainer extends React.PureComponent<Props> {

  public componentDidMount(): void {
    const { isLoading, requestWorkspaces } = this.props;
    if (!isLoading) {
      requestWorkspaces();
    }
  }

  render() {
    const { branding, history, allWorkspaces, isLoading } = this.props;

    if (isLoading) {
      return Fallback;
    }

    return (
      <WorkspaceActionsProvider>
        <WorkspaceActionsConsumer>
          {context => (
            <WorkspacesList
              branding={branding.data}
              history={history}
              workspaces={allWorkspaces}
              onAction={(action, id) => context.handleAction(action, id)}
              showConfirmation={wantDelete => context.showConfirmation(wantDelete)}
              isDeleted={context.isDeleted}
            >
            </WorkspacesList>
          )}
        </WorkspaceActionsConsumer>
      </WorkspaceActionsProvider>
    );
  }

}

const mapStateToProps = (state: AppState) => {
  const { branding } = state;
  return {
    branding,
    allWorkspaces: selectAllWorkspaces(state),
    isLoading: selectIsLoading(state),
  };
};

const connector = connect(
  mapStateToProps,
  WorkspacesStore.actionCreators
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(WorkspacesListContainer);
