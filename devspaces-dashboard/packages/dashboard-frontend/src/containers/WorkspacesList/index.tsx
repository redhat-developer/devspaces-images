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

import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Location, NavigateFunction, useLocation, useNavigate } from 'react-router-dom';

import Fallback from '@/components/Fallback';
import WorkspacesList from '@/pages/WorkspacesList';
import { AppState } from '@/store';
import { selectBranding } from '@/store/Branding/selectors';
import * as WorkspacesStore from '@/store/Workspaces';
import { selectAllWorkspaces, selectIsLoading } from '@/store/Workspaces/selectors';

type Props = MappedProps & {
  location: Location;
  navigate: NavigateFunction;
};

export class WorkspacesListContainer extends React.PureComponent<Props> {
  render() {
    const { branding, allWorkspaces, isLoading, location, navigate } = this.props;

    if (isLoading) {
      return Fallback;
    }

    return (
      <WorkspacesList
        branding={branding}
        location={location}
        navigate={navigate}
        workspaces={allWorkspaces}
      />
    );
  }
}

function ContainerWrapper(props: MappedProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return <WorkspacesListContainer {...props} location={location} navigate={navigate} />;
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
export default connector(ContainerWrapper);
