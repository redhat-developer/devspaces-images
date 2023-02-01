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

import React from 'react';
import {
  ApplicationLauncher,
  ApplicationLauncherGroup,
  ApplicationLauncherItem,
} from '@patternfly/react-core';
import { ApplicationInfo } from '@eclipse-che/common';

type Props = {
  applications: ApplicationInfo[];
};
type State = {
  isOpen: boolean;
};

export class ApplicationsMenu extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isOpen: false,
    };
  }

  private onToggle(isOpen: boolean): void {
    this.setState({
      isOpen: isOpen,
    });
  }

  private buildMenuItems(): React.ReactElement[] {
    const apps = this.props.applications;
    const defaultAppsGroup = 'Applications';
    const itemsByGroup: { [groupName: string]: React.ReactElement[] } = {
      [defaultAppsGroup]: [],
    };
    apps.forEach(app => {
      if (!app) {
        return;
      }

      const group = app.group || defaultAppsGroup;
      if (itemsByGroup[group] === undefined) {
        itemsByGroup[group] = [];
      }

      const item = (
        <ApplicationLauncherItem
          key={app.url}
          isExternal={true}
          icon={<img src={app.icon} />}
          href={app.url}
          target="_blank"
        >
          {app.title}
        </ApplicationLauncherItem>
      );

      itemsByGroup[group].push(item);
    });

    const groupedItems: React.ReactElement[] = [];
    Object.keys(itemsByGroup).forEach(group => {
      const items = itemsByGroup[group];
      if (items.length === 0) {
        return;
      }
      const groupItem = (
        <ApplicationLauncherGroup key={group} label={group}>
          {items}
        </ApplicationLauncherGroup>
      );
      groupedItems.push(groupItem);
    });

    return groupedItems;
  }

  render(): React.ReactElement {
    const groupedItems = this.buildMenuItems();

    return (
      <ApplicationLauncher
        aria-label="External Applications"
        isOpen={this.state.isOpen}
        onToggle={isOpen => this.onToggle(isOpen)}
        items={groupedItems}
      />
    );
  }
}
