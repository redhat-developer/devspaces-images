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

import 'reflect-metadata';

import common from '@eclipse-che/common';
import {
  AlertVariant,
  Divider,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import {
  classNames,
  IAction,
  ICell,
  IRowData,
  sortable,
  SortByDirection,
  Table,
  TableBody,
  TableHeader,
  TableVariant,
  Visibility,
} from '@patternfly/react-table';
import { History, Location } from 'history';
import React from 'react';

import Head from '@/components/Head';
import { lazyInject } from '@/inversify.config';
import NothingFoundEmptyState from '@/pages/WorkspacesList/EmptyState/NothingFound';
import NoWorkspacesEmptyState from '@/pages/WorkspacesList/EmptyState/NoWorkspaces';
import styles from '@/pages/WorkspacesList/index.module.css';
import { buildRows, RowData } from '@/pages/WorkspacesList/Rows';
import WorkspacesListToolbar from '@/pages/WorkspacesList/Toolbar';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { BrandingData } from '@/services/bootstrap/branding.constant';
import { buildGettingStartedLocation } from '@/services/helpers/location';
import getRandomString from '@/services/helpers/random';
import { DevWorkspaceStatus, WorkspaceAction } from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';

type Props = {
  branding: BrandingData;
  history: History;
  workspaces: Workspace[];
  toDelete: string[];
  onAction: (action: WorkspaceAction, uid: string) => Promise<Location | void>;
  showConfirmation: (wantDelete: string[]) => Promise<void>;
};
type State = {
  filtered: string[]; // UIDs of filtered workspaces
  selected: string[]; // UIDs of selected workspaces
  isSelectedAll: boolean;
  rows: RowData[];
  sortBy: {
    index: number;
    direction: SortByDirection;
  };
};

export default class WorkspacesList extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private appAlerts: AppAlerts;

  private readonly columns: (ICell | string)[];

  constructor(props: Props) {
    super(props);

    this.columns = [
      {
        title: <span className={styles.nameColumnTitle}>Name</span>,
        dataLabel: 'Name',
        transforms: [sortable],
      },
      {
        title: 'Last Modified',
        dataLabel: 'Last Modified',
        transforms: [sortable, classNames(styles.lastModifiedColumnTitle)],
      },
      {
        title: 'Project(s)',
        dataLabel: 'Project(s)',
        cellTransforms: [classNames(styles.projectsCell)],
      },
      {
        // Column is visible only on Sm
        // content is aligned to the left
        title: '',
        dataLabel: ' ',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        columnTransforms: [classNames(Visibility.visibleOnSm!, Visibility.hiddenOnMd!)],
      },
      {
        // Column is hidden only on Sm
        // content is aligned to the right
        title: '',
        dataLabel: ' ',
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        cellTransforms: [
          classNames(
            styles.openIdeCell,
            Visibility.hidden!,
            Visibility.hiddenOnSm!,
            Visibility.visibleOnMd!,
          ),
        ],
      },
    ];

    const filtered = this.props.workspaces.map(workspace => workspace.uid);
    this.state = {
      filtered,
      selected: [],
      isSelectedAll: false,
      rows: [],
      sortBy: {
        index: 1,
        direction: SortByDirection.asc,
      },
    };
  }

  private showAlert(message: string, variant = AlertVariant.warning): void {
    this.appAlerts.showAlert({
      key: 'workspaces-list-' + getRandomString(4),
      title: message,
      variant,
    });
  }

  private buildRows(): RowData[] {
    const { toDelete, workspaces } = this.props;
    const { filtered, selected, sortBy } = this.state;

    return buildRows(workspaces, toDelete, filtered, selected, sortBy);
  }

  private actionResolver(rowData: IRowData): IAction[] {
    const uid = (rowData as RowData).props.workspaceUID;
    const workspace = this.props.workspaces.find(workspace => uid === workspace.uid);

    if (!workspace) {
      console.warn('Unable to build list of actions: Workspace not found.');
      return [];
    }

    if (workspace.isDeprecated) {
      return [
        {
          title: 'Delete Workspace',
          onClick: (event, rowId, rowData) =>
            this.handleAction(WorkspaceAction.DELETE_WORKSPACE, rowData),
          isDisabled: false === this.isEnabledAction(WorkspaceAction.DELETE_WORKSPACE, workspace),
        },
      ];
    }

    return [
      {
        title: 'Open in Debug mode',
        isDisabled:
          false === this.isEnabledAction(WorkspaceAction.START_DEBUG_AND_OPEN_LOGS, workspace),
        onClick: (event, rowId, rowData) =>
          this.handleAction(WorkspaceAction.START_DEBUG_AND_OPEN_LOGS, rowData),
      },
      {
        title: 'Start in Background',
        isDisabled: false === this.isEnabledAction(WorkspaceAction.START_IN_BACKGROUND, workspace),
        onClick: (event, rowId, rowData) =>
          this.handleAction(WorkspaceAction.START_IN_BACKGROUND, rowData),
      },
      {
        title: WorkspaceAction.RESTART_WORKSPACE,
        isDisabled: false === this.isEnabledAction(WorkspaceAction.RESTART_WORKSPACE, workspace),
        onClick: (event, rowId, rowData) =>
          this.handleAction(WorkspaceAction.RESTART_WORKSPACE, rowData),
      },
      {
        title: 'Stop Workspace',
        isDisabled: false === this.isEnabledAction(WorkspaceAction.STOP_WORKSPACE, workspace),
        onClick: (event, rowId, rowData) =>
          this.handleAction(WorkspaceAction.STOP_WORKSPACE, rowData),
      },
      {
        title: 'Delete Workspace',
        onClick: (event, rowId, rowData) =>
          this.handleAction(WorkspaceAction.DELETE_WORKSPACE, rowData),
        isDisabled: false === this.isEnabledAction(WorkspaceAction.DELETE_WORKSPACE, workspace),
      },
    ];
  }

  private isEnabledAction(action: WorkspaceAction, workspace: Workspace): boolean {
    if (workspace.status === DevWorkspaceStatus.TERMINATING) {
      return false;
    }
    if (
      action === WorkspaceAction.START_DEBUG_AND_OPEN_LOGS ||
      action === WorkspaceAction.START_IN_BACKGROUND
    ) {
      return !workspace.isStarting && !workspace.isRunning && !workspace.isStopping;
    }
    if (action === WorkspaceAction.STOP_WORKSPACE && workspace.hasError) {
      return true;
    }
    if (action === WorkspaceAction.STOP_WORKSPACE || action === WorkspaceAction.RESTART_WORKSPACE) {
      return workspace.isStarting || workspace.isRunning;
    }
    return true;
  }

  private async handleAction(action: WorkspaceAction, rowData: IRowData): Promise<void> {
    const uid = (rowData as RowData).props.workspaceUID;
    try {
      if (action === WorkspaceAction.DELETE_WORKSPACE) {
        // show confirmation window
        const workspace = this.props.workspaces.find(workspace => uid === workspace.uid);
        const workspaceName = workspace?.name || uid;
        try {
          await this.props.showConfirmation([workspaceName]);
        } catch (e) {
          return;
        }
      }

      const nextPath = await this.props.onAction(action, uid);
      if (!nextPath) {
        return;
      }
      this.props.history.push(nextPath);
    } catch (e) {
      const errorMessage = common.helpers.errors.getMessage(e);
      this.showAlert(errorMessage);
      console.warn(errorMessage);
    }
  }

  private async handleBulkDelete(): Promise<void> {
    const { selected } = this.state;
    const { workspaces } = this.props;

    // show confirmation window
    try {
      const wantDelete = selected.map(uid => {
        const workspace = workspaces.find(workspace => uid === workspace.uid);
        return workspace?.name || uid;
      });
      await this.props.showConfirmation(wantDelete);
    } catch (e) {
      return;
    }

    const promises = selected.map(async uid => {
      try {
        await this.props.onAction(WorkspaceAction.DELETE_WORKSPACE, uid);
        return uid;
      } catch (e) {
        const workspace = this.props.workspaces.find(workspace => uid === workspace.uid);
        const workspaceName = workspace?.name ? `workspace "${workspace.name}"` : 'workspace';
        const message =
          `Unable to terminate ${workspaceName}. ` +
          common.helpers.errors.getMessage(e).replace('Error: ', '');
        this.showAlert(message);
        console.warn(message);
        throw new Error(message);
      }
    });

    try {
      const results = await Promise.allSettled(promises);

      let fulfilled = 0;
      let rejected = 0;
      const { selected } = this.state;
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          fulfilled += 1;
          const idx = selected.indexOf(result.value);
          if (idx !== -1) {
            selected.splice(idx, 1);
          }
        } else {
          rejected += 1;
        }
      });
      this.setState({
        selected,
      });

      if (!rejected) {
        const message =
          promises.length === 1
            ? `The workspace was terminated successfully`
            : `${promises.length} workspaces were terminated successfully.`;
        this.showAlert(message, AlertVariant.success);
      } else if (rejected === promises.length) {
        const message = 'No workspaces were deleted.';
        this.showAlert(message, AlertVariant.warning);
      } else {
        const message =
          fulfilled === 1
            ? `${fulfilled} of ${promises.length} workspaces was terminated.`
            : `${fulfilled} of ${promises.length} workspaces were terminated.`;
        this.showAlert(message, AlertVariant.warning);
      }
    } catch (e) {
      const message = `Bulk workspaces deletion failed due to ${e}.`;
      console.error(message);
      this.showAlert(message, AlertVariant.danger);
    }
  }

  private handleFilter(filtered: Workspace[]): void {
    const selected = filtered
      .map(workspace => workspace.uid)
      .filter(uid => this.state.selected.includes(uid));
    const isSelectedAll = selected.length !== 0 && selected.length === filtered.length;
    this.setState({
      filtered: filtered.map(workspace => workspace.uid),
      selected,
      isSelectedAll,
    });
  }

  private handleSelectAll(isSelectedAll: boolean): void {
    const selected = isSelectedAll === false ? [] : [...this.state.filtered];

    this.setState({
      selected,
      isSelectedAll,
    });
  }

  private handleSelect(isSelected: boolean, rowIndex: number, rowData?: IRowData): void {
    const { workspaces } = this.props;

    if (rowIndex === -1) {
      /* (un)select all */
      const isSelectedAll = isSelected;
      const selected = isSelectedAll === false ? [] : workspaces.map(workspace => workspace.uid);
      this.setState({
        selected,
        isSelectedAll,
      });
      return;
    }

    /* (un)select specified row */
    const uid = (rowData as RowData).props.workspaceUID;
    const selected = [...this.state.selected];
    const idx = selected.indexOf(uid);
    if (idx === -1) {
      if (isSelected) {
        selected.push(uid);
      }
    } else {
      if (!isSelected) {
        selected.splice(idx, 1);
      }
    }
    const isSelectedAll = selected.length !== 0 && selected.length === workspaces.length;
    this.setState({
      selected,
      isSelectedAll,
    });
  }

  private areActionsDisabled(rowData: IRowData): boolean {
    const uid = (rowData as RowData).props.workspaceUID;
    return this.props.toDelete.includes(uid);
  }

  private handleAddWorkspace(): void {
    const location = buildGettingStartedLocation('quick-add');
    this.props.history.push(location);
  }

  private handleSort(event: React.MouseEvent, index: number, direction: SortByDirection): void {
    this.setState({
      sortBy: {
        index,
        direction,
      },
    });
  }

  public componentDidUpdate(prevProps: Props): void {
    const prevUIDs = prevProps.workspaces
      .map(w => w.uid)
      .sort()
      .join(',');
    const UIDs = this.props.workspaces
      .map(w => w.uid)
      .sort()
      .join(',');
    if (prevUIDs !== UIDs) {
      const selected: string[] = [];
      const filtered: string[] = [];
      this.props.workspaces.forEach(workspace => {
        if (this.state.selected.indexOf(workspace.uid) !== -1) {
          selected.push(workspace.uid);
        }
        filtered.push(workspace.uid);
      });
      const isSelectedAll =
        selected.length !== 0 && selected.length === this.props.workspaces.length;
      this.setState({
        filtered,
        isSelectedAll,
        selected,
      });
    }
    /* Update checkboxes states if workspaces are deleting */
    if (prevProps.toDelete.length !== this.props.toDelete.length) {
      const selected = this.state.selected.filter(
        uid => false === this.props.toDelete.includes(uid),
      );
      this.setState({
        selected,
      });
    }
  }

  public render(): React.ReactElement {
    const { workspaces } = this.props;
    const { workspace: workspacesDocsLink } = this.props.branding.docs;
    const { selected, isSelectedAll, sortBy } = this.state;
    const rows = this.buildRows();

    const toolbar = (
      <WorkspacesListToolbar
        workspaces={workspaces}
        selectedAll={isSelectedAll}
        enabledDelete={selected.length !== 0}
        onAddWorkspace={() => this.handleAddWorkspace()}
        onBulkDelete={() => this.handleBulkDelete()}
        onFilter={filtered => this.handleFilter(filtered)}
        onToggleSelectAll={isSelectedAll => this.handleSelectAll(isSelectedAll)}
      />
    );

    let emptyState: React.ReactElement = <></>;
    if (workspaces.length === 0) {
      emptyState = <NoWorkspacesEmptyState onAddWorkspace={() => this.handleAddWorkspace()} />;
    } else if (rows.length === 0) {
      emptyState = <NothingFoundEmptyState />;
    }

    return (
      <React.Fragment>
        <Head pageName="Workspaces" />
        <PageSection variant={PageSectionVariants.light}>
          <TextContent>
            <Text component={'h1'}>Workspaces</Text>
            <Text component={'p'}>
              A workspace is where your projects live and run. Create workspaces from stacks that
              define projects, runtimes, and commands.&emsp;
              <a href={workspacesDocsLink} target="_blank" rel="noopener noreferrer">
                Learn&nbsp;more&nbsp;
                <ExternalLinkAltIcon />
              </a>
            </Text>
          </TextContent>
        </PageSection>
        <PageSection
          padding={{ default: 'noPadding' }}
          variant={PageSectionVariants.light}
          isFilled={false}
        >
          <Divider component="div" className="pf-u-mt-xl" />
          <Table
            actionResolver={rowData => this.actionResolver(rowData)}
            areActionsDisabled={rowData => this.areActionsDisabled(rowData)}
            aria-label="Workspaces List Table"
            canSelectAll={false}
            cells={this.columns}
            onSelect={(event, isSelected, rowIndex, rowData) => {
              event.stopPropagation();
              this.handleSelect(isSelected, rowIndex, rowData);
            }}
            rows={rows}
            variant={TableVariant.compact}
            header={toolbar}
            sortBy={sortBy}
            onSort={(event, index, direction) => this.handleSort(event, index, direction)}
          >
            <TableHeader />
            <TableBody />
          </Table>
        </PageSection>
        {emptyState}
      </React.Fragment>
    );
  }
}
