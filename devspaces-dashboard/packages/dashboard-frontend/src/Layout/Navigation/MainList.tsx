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
import { NavList } from '@patternfly/react-core';
import NavigationMainItem from './MainItem';
import { NavigationItemObject } from '.';
import { ROUTE } from '../../route.enum';
import { AppState } from '../../store';
import { connect, ConnectedProps } from 'react-redux';
import { selectAllWorkspaces } from '../../store/Workspaces/selectors';

type Props = MappedProps & {
  activePath: string;
};

export class NavigationMainList extends React.PureComponent<Props> {
  private get items(): NavigationItemObject[] {
    const { allWorkspaces } = this.props;

    const allWorkspacesNumber = allWorkspaces.filter(workspace => {
      if (workspace.isDevWorkspace) {
        return true;
      }
      return (workspace.ref as che.Workspace).attributes?.convertedId === undefined;
    }).length;

    return [
      { to: ROUTE.GET_STARTED, label: 'Create Workspace' },
      { to: ROUTE.WORKSPACES, label: `Workspaces (${allWorkspacesNumber})` },
    ];
  }

  public render(): React.ReactElement {
    const { activePath } = this.props;

    const navItems = this.items.map(item => {
      return <NavigationMainItem key={item.label} item={item} activePath={activePath} />;
    });

    return <NavList>{navItems}</NavList>;
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(NavigationMainList);
