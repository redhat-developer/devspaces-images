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

import { NavItem } from '@patternfly/react-core';
import { History } from 'history';
import React from 'react';

import WorkspaceIndicator from '@/components/Workspace/Indicator';
import styles from '@/Layout/Navigation/index.module.css';
import getActivity from '@/Layout/Navigation/isActive';
import NavigationItemWorkspaceActions from '@/Layout/Navigation/RecentItemWorkspaceActions';

import { NavigationRecentItemObject } from '.';

function NavigationRecentItem(props: {
  item: NavigationRecentItemObject;
  activePath: string;
  history: History;
  isDefaultExpanded?: boolean;
}): React.ReactElement {
  return (
    <NavItem
      data-testid={props.item.to}
      itemId={props.item.to}
      isActive={getActivity(props.item.to, props.activePath)}
      className={styles.navItem}
      preventDefault={true}
      onClick={() =>
        handleClick(
          props.history,
          props.item.to,
          props.item.workspaceUID,
          props.item.isDevWorkspace,
        )
      }
    >
      <span data-testid="recent-workspace-item">
        <WorkspaceIndicator status={props.item.status} />
        {props.item.label}
      </span>
      <NavigationItemWorkspaceActions
        item={props.item}
        history={props.history}
        isDefaultExpanded={props.isDefaultExpanded}
      />
    </NavItem>
  );
}

/**
 * Open the link in a new tab if it's a devWorkspace, else open in it in the current window in iframe
 */
function handleClick(
  history: History,
  location: string,
  workspaceUID: string,
  isDevWorkspace: boolean,
) {
  if (isDevWorkspace) {
    const link = `#${location}`;
    window.open(link, workspaceUID);
  } else {
    history.push(location);
  }
}

NavigationRecentItem.displayName = 'NavigationRecentItemComponent';
export default NavigationRecentItem;
