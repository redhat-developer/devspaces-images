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
import { connect, ConnectedProps } from 'react-redux';
import { History } from 'history';
import { AppState } from '../store';
import { selectAllWorkspaces, selectIsLoading } from '../store/Workspaces/selectors';
import * as WorkspacesStore from '../store/Workspaces';
import Fallback from '../components/Fallback';
import WorkspacesList from '../pages/WorkspacesList';
import WorkspaceActionsProvider from '../contexts/WorkspaceActions/Provider';
import { WorkspaceActionsConsumer } from '../contexts/WorkspaceActions';
import { lazyInject } from '../inversify.config';
import { AppAlerts } from '../services/alerts/appAlerts';
import { selectBranding } from '../store/Branding/selectors';

type Props = MappedProps & { history: History };

export class WorkspacesListContainer extends React.PureComponent<Props> {
  @lazyInject(AppAlerts)
  private appAlerts: AppAlerts;

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
      <WorkspaceActionsProvider history={history}>
        <WorkspaceActionsConsumer>
          {context => (
            <WorkspacesList
              branding={branding}
              history={history}
              workspaces={allWorkspaces}
              onAction={(action, uid) => context.handleAction(action, uid)}
              showConfirmation={wantDelete => context.showConfirmation(wantDelete)}
              toDelete={context.toDelete}
            />
          )}
        </WorkspaceActionsConsumer>
      </WorkspaceActionsProvider>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    branding: selectBranding(state),
    allWorkspaces: selectAllWorkspaces(state),
    isLoading: selectIsLoading(state),
  };
};

const connector = connect(mapStateToProps, WorkspacesStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(WorkspacesListContainer);
