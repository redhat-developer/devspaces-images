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

import { History } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import Fallback from '@/components/Fallback';
import WorkspacesList from '@/pages/WorkspacesList';
import { AppState } from '@/store';
import { selectBranding } from '@/store/Branding/selectors';
import * as WorkspacesStore from '@/store/Workspaces';
import { selectAllWorkspaces, selectIsLoading } from '@/store/Workspaces/selectors';

type Props = MappedProps & { history: History };

export class WorkspacesListContainer extends React.PureComponent<Props> {
  render() {
    const { branding, history, allWorkspaces, isLoading } = this.props;

    if (isLoading) {
      return Fallback;
    }

    return <WorkspacesList branding={branding} history={history} workspaces={allWorkspaces} />;
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
