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

import { History } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import Fallback from '@/components/Fallback';
import { WorkspaceActionsConsumer } from '@/contexts/WorkspaceActions';
import WorkspaceActionsProvider from '@/contexts/WorkspaceActions/Provider';
import { lazyInject } from '@/inversify.config';
import WorkspacesList from '@/pages/WorkspacesList';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { AppState } from '@/store';
import { selectBranding } from '@/store/Branding/selectors';
import * as WorkspacesStore from '@/store/Workspaces';
import { selectAllWorkspaces, selectIsLoading } from '@/store/Workspaces/selectors';

type Props = MappedProps & { history: History };

export class WorkspacesListContainer extends React.PureComponent<Props> {
  @lazyInject(AppAlerts)
  private appAlerts: AppAlerts;

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
