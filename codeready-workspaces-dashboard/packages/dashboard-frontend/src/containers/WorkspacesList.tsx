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
import { History } from 'history';
import { AppState } from '../store';
import {
  selectAllWorkspaces,
  selectIsLoading,
  selectWorkspacesError,
} from '../store/Workspaces/selectors';
import * as WorkspacesStore from '../store/Workspaces';
import Fallback from '../components/Fallback';
import WorkspacesList from '../pages/WorkspacesList';
import WorkspaceActionsProvider from './WorkspaceActions';
import { WorkspaceActionsConsumer } from './WorkspaceActions/context';
import { lazyInject } from '../inversify.config';
import { AppAlerts } from '../services/alerts/appAlerts';
import { AlertVariant } from '@patternfly/react-core';
import { selectBranding } from '../store/Branding/selectors';
import { isDevWorkspace } from '../services/devfileApi';

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

  public componentDidUpdate(): void {
    const { error } = this.props;
    if (error) {
      const key = 'workspaces-error';
      this.appAlerts.removeAlert(key);
      this.appAlerts.showAlert({
        key,
        title: error,
        variant: AlertVariant.danger,
      });
    }
  }

  render() {
    const { branding, history, allWorkspaces, isLoading } = this.props;

    if (isLoading) {
      return Fallback;
    }

    const ids = allWorkspaces.map(workspace => workspace.id);
    const filteredWorkspaces = allWorkspaces.filter(workspace => {
      if (workspace.isDeprecated === false) {
        return true;
      }
      if (isDevWorkspace(workspace.ref)) {
        return true;
      }
      const convertedId = workspace.ref.attributes?.convertedId;
      if (convertedId === undefined) {
        return true;
      }
      return ids.includes(convertedId) === false;
    });

    return (
      <WorkspaceActionsProvider history={history}>
        <WorkspaceActionsConsumer>
          {context => (
            <WorkspacesList
              branding={branding}
              history={history}
              workspaces={filteredWorkspaces}
              onAction={(action, id) => context.handleAction(action, id)}
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
    error: selectWorkspacesError(state),
  };
};

const connector = connect(mapStateToProps, WorkspacesStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(WorkspacesListContainer);
