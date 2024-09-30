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

import { Button } from '@patternfly/react-core';
import { IRow, SortByDirection } from '@patternfly/react-table';
import { Location } from 'history';
import { History } from 'history';
import React from 'react';
import { Link } from 'react-router-dom';

import { WorkspaceStatusIndicator } from '@/components/Workspace/Status/Indicator';
import { WorkspaceActionsConsumer } from '@/contexts/WorkspaceActions';
import { WorkspaceActionsDropdown } from '@/contexts/WorkspaceActions/Dropdown';
import { container } from '@/inversify.config';
import devfileApi from '@/services/devfileApi';
import { formatDate, formatRelativeDate } from '@/services/helpers/dates';
import { buildDetailsLocation, buildIdeLoaderLocation, toHref } from '@/services/helpers/location';
import { DevWorkspaceStatus } from '@/services/helpers/types';
import { TabManager } from '@/services/tabManager';
import { Workspace } from '@/services/workspace-adapter';

export interface RowData extends IRow {
  props: {
    workspaceUID: string;
  };
}

export function buildRows(
  history: History,
  workspaces: Workspace[],
  toDelete: string[],
  filtered: string[],
  selected: string[],
  sortBy: { index: number; direction: SortByDirection },
): RowData[] {
  const rows: RowData[] = [];
  workspaces
    // skip workspaces that are not match a filter
    .filter(workspace => filtered.includes(workspace.uid))
    .sort((workspaceA, workspaceB) => {
      if (sortBy.index === 1) {
        const nameA = workspaceA.name || '';
        const nameB = workspaceB.name || '';
        return sort(nameA, nameB, sortBy.direction);
      }
      if (sortBy.index === 2) {
        const updatedA = workspaceA.updated || workspaceA.created || 0;
        const updatedB = workspaceB.updated || workspaceB.created || 0;
        return sort(updatedA, updatedB, sortBy.direction);
      }
      return 0;
    })
    .forEach(workspace => {
      const isSelected = selected.includes(workspace.uid);
      const isDeleted = toDelete.includes(workspace.uid);

      const overviewPageLocation = buildDetailsLocation(workspace);
      const ideLoaderLocation = buildIdeLoaderLocation(workspace);

      const ideLoaderHref = toHref(history, ideLoaderLocation);

      try {
        rows.push(buildRow(workspace, isSelected, isDeleted, overviewPageLocation, ideLoaderHref));
      } catch (e) {
        console.warn('Skip workspace: ', e);
      }
    });
  return rows;
}

function sort(a: string | number, b: string | number, direction: SortByDirection): -1 | 0 | 1 {
  if (a > b) {
    return direction === SortByDirection.asc ? 1 : -1;
  } else if (a < b) {
    return direction === SortByDirection.asc ? -1 : 1;
  }
  return 0;
}

export function buildRow(
  workspace: Workspace,
  isSelected: boolean,
  isDeleted: boolean,
  overviewPageLocation: Location,
  ideLoaderHref: string,
): RowData {
  if (!workspace.name) {
    throw new Error('Empty workspace name.');
  }
  if (!workspace.namespace) {
    throw new Error('Empty namespace');
  }

  /* workspace status indicator */
  const statusIndicator = <WorkspaceStatusIndicator status={workspace.status} />;
  /* workspace name */
  const details = (
    <span>
      {statusIndicator}
      <Button variant="link" component={props => <Link {...props} to={overviewPageLocation} />}>
        {workspace.name}
      </Button>
    </span>
  );

  /* last modified time */
  const lastModifiedMs = workspace.updated;
  let lastModifiedDate = '';
  if (lastModifiedMs) {
    const nowMs = Date.now();
    // show relative date if last modified withing an hour
    if (nowMs - lastModifiedMs < 60 * 60 * 1000) {
      lastModifiedDate = formatRelativeDate(lastModifiedMs);
    } else {
      lastModifiedDate = formatDate(lastModifiedMs);
    }
  }

  /* projects list */
  const projects: string[] = [];
  const workspaceProjects = (workspace.ref as devfileApi.DevWorkspace).spec.template.projects;
  (workspaceProjects || [])
    .map(project => project.name || project.git?.remotes?.origin)
    .filter((projectName?: string): projectName is string => {
      return typeof projectName === 'string' && projectName !== '';
    })
    .forEach((projectName: string) => projects.push(projectName));

  const projectsList = projects.join(', \n') || '-';

  /* action: Open */
  let action: React.ReactElement | string;
  if (workspace.isDeprecated) {
    action = <></>;
  } else if (isDeleted || workspace.status === DevWorkspaceStatus.TERMINATING) {
    action = 'deleting...';
  } else {
    const tabManager = container.get(TabManager);
    action = (
      <Button variant="link" isInline isSmall onClick={() => tabManager.open(ideLoaderHref)}>
        Open
      </Button>
    );
  }

  /* Actions dropdown */
  const actionsDropdown = (
    <WorkspaceActionsConsumer>
      {context => {
        return (
          <WorkspaceActionsDropdown
            context={context}
            isDisabled={
              workspace.isDeprecated ||
              isDeleted ||
              workspace.status === DevWorkspaceStatus.TERMINATING
            }
            isPlain
            position="right"
            toggle="kebab-toggle"
            workspace={workspace}
            onAction={async () => {
              // no-op
            }}
          />
        );
      }}
    </WorkspaceActionsConsumer>
  );

  return {
    cells: [
      {
        title: details,
        key: 'workspace-name',
      },
      {
        title: lastModifiedDate,
        key: 'last-modified-time',
      },
      {
        title: projectsList,
        key: 'projects-list',
      },
      {
        // Cell is visible only on Sm
        title: action,
        key: 'open-ide-visible-sm',
      },
      {
        // Cell is hidden only on Sm
        title: action,
        key: 'open-ide-hidden-sm',
      },
      {
        title: actionsDropdown,
        key: 'actions-dropdown',
      },
    ],
    props: {
      workspaceUID: workspace.uid,
    },
    selected: isSelected || isDeleted,
    disableSelection: isDeleted,
  };
}
