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
import { NavItem } from '@patternfly/react-core';
import { NavigationRecentItemObject } from '.';
import getActivity from './isActive';
import WorkspaceIndicator from '../../components/Workspace/Indicator';
import { History } from 'history';
import styles from './index.module.css';
import NavigationItemWorkspaceActions from './RecentItemWorkspaceActions';

function NavigationRecentItem(props: {
  item: NavigationRecentItemObject,
  activePath: string,
  history: History,
  isDefaultExpanded?: boolean,
}): React.ReactElement {
  return (
    <NavItem
      data-testid={props.item.to}
      itemId={props.item.to}
      isActive={getActivity(props.item.to, props.activePath)}
      className={styles.navItem}
      preventDefault={true}
      onClick={() => props.history.push(props.item.to)}
    >
      <span data-testid="recent-workspace-item"><WorkspaceIndicator
        status={props.item.status} />{props.item.label}</span>
      <NavigationItemWorkspaceActions item={props.item} history={props.history}
        isDefaultExpanded={props.isDefaultExpanded} />
    </NavItem>
  );
}

NavigationRecentItem.displayName = 'NavigationRecentItemComponent';
export default NavigationRecentItem;
