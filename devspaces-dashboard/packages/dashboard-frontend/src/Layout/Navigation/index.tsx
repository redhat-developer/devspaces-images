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

import { Nav } from '@patternfly/react-core';
import { History, Location, UnregisterCallback } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import NavigationMainList from '@/Layout/Navigation/MainList';
import NavigationRecentList from '@/Layout/Navigation/RecentList';
import { ROUTE } from '@/Routes/routes';
import { buildGettingStartedLocation, buildWorkspacesLocation } from '@/services/helpers/location';
import {
  DeprecatedWorkspaceStatus,
  DevWorkspaceStatus,
  WorkspaceStatus,
} from '@/services/helpers/types';
import { AppState } from '@/store';
import * as WorkspacesStore from '@/store/Workspaces';
import { selectAllWorkspaces, selectRecentWorkspaces } from '@/store/Workspaces/selectors';

export interface NavigationItemObject {
  to: string;
  label: string;
  icon?: React.ReactElement;
}
export interface NavigationRecentItemObject {
  to: string;
  label: string;
  status: WorkspaceStatus | DevWorkspaceStatus | DeprecatedWorkspaceStatus;
  workspaceUID: string;
  isDevWorkspace: boolean;
}

type Props = MappedProps & {
  history: History;
};

type State = {
  activeLocation: Location;
};

export class Navigation extends React.PureComponent<Props, State> {
  private readonly unregisterFn: UnregisterCallback;

  constructor(props: Props) {
    super(props);

    const activeLocation = this.props.history.location;
    let newLocation: Location | undefined;

    if (activeLocation.pathname === ROUTE.HOME) {
      const workspacesNumber = this.props.allWorkspaces.length;
      if (workspacesNumber === 0) {
        newLocation = buildGettingStartedLocation('quick-add');
      } else {
        newLocation = buildWorkspacesLocation();
      }
    }
    if (newLocation) {
      this.props.history.replace(newLocation);
    }

    this.state = {
      activeLocation: newLocation || activeLocation,
    };

    this.unregisterFn = this.props.history.listen((location: Location) => {
      this.setActivePath(location.pathname);
    });
  }

  private handleNavSelect(selected: {
    groupId: React.ReactText;
    itemId: React.ReactText;
    to: string;
    event: React.FormEvent<HTMLInputElement>;
  }): void {
    const activeLocation = {
      pathname: selected.itemId as string,
    } as Location;
    this.setState({
      activeLocation,
    });
  }

  private setActivePath(path: string): void {
    const activeLocation = {
      pathname: path,
    } as Location;
    this.setState({
      activeLocation,
    });
  }

  public componentWillUnmount(): void {
    this.unregisterFn();
  }

  public render(): React.ReactElement {
    const { recentWorkspaces, history } = this.props;
    const { activeLocation } = this.state;

    return (
      <Nav aria-label="Navigation" onSelect={selected => this.handleNavSelect(selected)}>
        <NavigationMainList activePath={activeLocation.pathname} />
        <NavigationRecentList
          workspaces={recentWorkspaces}
          activePath={activeLocation.pathname}
          history={history}
        />
      </Nav>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  recentWorkspaces: selectRecentWorkspaces(state),
  allWorkspaces: selectAllWorkspaces(state),
});
const connector = connect(mapStateToProps, WorkspacesStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;

export default connector(Navigation);
