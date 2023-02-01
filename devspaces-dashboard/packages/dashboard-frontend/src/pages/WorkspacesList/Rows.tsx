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
import { Link } from 'react-router-dom';
import { Location } from 'history';
import { IRow, SortByDirection } from '@patternfly/react-table';
import { Button } from '@patternfly/react-core';
import WorkspaceIndicator from '../../components/Workspace/Indicator';
import { formatDate, formatRelativeDate } from '../../services/helpers/date';
import { buildDetailsLocation, buildIdeLoaderLocation } from '../../services/helpers/location';
import { Workspace } from '../../services/workspace-adapter';
import devfileApi from '../../services/devfileApi';
import { DevWorkspaceStatus, WorkspaceDetailsTab } from '../../services/helpers/types';

export interface RowData extends IRow {
  props: {
    workspaceUID: string;
  };
}

export function buildRows(
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
      const devfilePageLocation = buildDetailsLocation(workspace, WorkspaceDetailsTab.DEVFILE);

      const ideLoaderLocation = buildIdeLoaderLocation(workspace);

      try {
        rows.push(
          buildRow(
            workspace,
            isSelected,
            isDeleted,
            overviewPageLocation,
            devfilePageLocation,
            ideLoaderLocation,
          ),
        );
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
  devfilePageLocation: Location,
  ideLoaderLocation: Location,
): RowData {
  if (!workspace.name) {
    throw new Error('Empty workspace name.');
  }
  if (!workspace.namespace) {
    throw new Error('Empty namespace');
  }

  /* workspace status indicator */
  const statusIndicator = <WorkspaceIndicator status={workspace.status} />;
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

  let action: React.ReactElement | string;
  if (workspace.isDeprecated) {
    action = (
      <Button
        variant="link"
        isInline
        isSmall
        component={props => <Link {...props} to={devfilePageLocation} />}
      >
        Convert
      </Button>
    );
  } else if (isDeleted || workspace.status === DevWorkspaceStatus.TERMINATING) {
    action = 'deleting...';
  } else {
    if (workspace.isDevWorkspace) {
      action = (
        <Button
          variant="link"
          isInline
          isSmall
          component={props => (
            <Link {...props} to={ideLoaderLocation} rel="noreferrer" target={workspace.uid} />
          )}
        >
          Open
        </Button>
      );
    } else {
      action = (
        <Button
          variant="link"
          isInline
          isSmall
          component={props => <Link {...props} to={ideLoaderLocation} />}
        >
          Open
        </Button>
      );
    }
  }

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
    ],
    props: {
      workspaceUID: workspace.uid,
    },
    selected: isSelected || isDeleted,
    disableSelection: isDeleted,
  };
}
