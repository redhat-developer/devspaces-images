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

import { NavItem } from '@patternfly/react-core';
import { History } from 'history';
import React from 'react';

import { WorkspaceStatusIndicator } from '@/components/Workspace/Status/Indicator';
import { NavigationRecentItemObject } from '@/Layout/Navigation';
import styles from '@/Layout/Navigation/index.module.css';
import getActivity from '@/Layout/Navigation/isActive';
import { TitleWithHover } from '@/Layout/Navigation/RecentItem/TitleWithHover';
import NavigationItemWorkspaceActions from '@/Layout/Navigation/RecentItemWorkspaceActions';

export type Props = {
  item: NavigationRecentItemObject;
  activePath: string;
  history: History;
  isDefaultExpanded?: boolean;
};

export default class NavigationRecentItem extends React.PureComponent<Props> {
  private handleClick(location: string, workspaceUID: string) {
    const link = `#${location}`;
    window.open(link, workspaceUID);
  }

  render(): React.ReactElement {
    const { activePath, history, item, isDefaultExpanded } = this.props;

    const isActive = getActivity(item.to, activePath);

    return (
      <NavItem
        data-testid={item.to}
        itemId={item.to}
        isActive={isActive}
        className={styles.navItem}
        preventDefault={true}
        onClick={() => this.handleClick(item.to, item.workspaceUID)}
      >
        <span data-testid="recent-workspace-item">
          <WorkspaceStatusIndicator status={item.status} />
          <TitleWithHover text={item.label} isActive={isActive} />
        </span>
        <NavigationItemWorkspaceActions
          item={item}
          history={history}
          isDefaultExpanded={isDefaultExpanded}
        />
      </NavItem>
    );
  }
}
