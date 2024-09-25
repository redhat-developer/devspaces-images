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
import React from 'react';

import { WorkspaceStatusIndicator } from '@/components/Workspace/Status/Indicator';
import { lazyInject } from '@/inversify.config';
import { NavigationRecentItemObject } from '@/Layout/Navigation';
import styles from '@/Layout/Navigation/index.module.css';
import getActivity from '@/Layout/Navigation/isActive';
import { TitleWithHover } from '@/Layout/Navigation/RecentItem/TitleWithHover';
import { RecentItemWorkspaceActions } from '@/Layout/Navigation/RecentItem/WorkspaceActions';
import { buildIdeLoaderLocation, toHref } from '@/services/helpers/location';
import { TabManager } from '@/services/tabManager';
import { Workspace } from '@/services/workspace-adapter';

export type Props = {
  item: NavigationRecentItemObject;
  activePath: string;
};

export class NavigationRecentItem extends React.PureComponent<Props> {
  @lazyInject(TabManager)
  private readonly tabManager: TabManager;

  private handleClick(workspace: Workspace) {
    const location = buildIdeLoaderLocation(workspace);
    const href = toHref(location);
    this.tabManager.open(href);
  }

  render(): React.ReactElement {
    const { activePath, item } = this.props;

    const isActive = getActivity(item.to, activePath);

    return (
      <NavItem
        id={item.to}
        data-testid={item.to}
        itemId={item.to}
        isActive={isActive}
        className={styles.navItem}
        preventDefault={true}
        onClick={() => this.handleClick(item.workspace)}
      >
        <span data-testid="recent-workspace-item">
          <WorkspaceStatusIndicator status={item.workspace.status} />
          <TitleWithHover text={item.label} isActive={isActive} />
        </span>
        <RecentItemWorkspaceActions item={item} />
      </NavItem>
    );
  }
}
