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

import 'reflect-metadata';

import {
  Divider,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import {
  classNames,
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
import { History } from 'history';
import React from 'react';

import Head from '@/components/Head';
import NothingFoundEmptyState from '@/pages/WorkspacesList/EmptyState/NothingFound';
import NoWorkspacesEmptyState from '@/pages/WorkspacesList/EmptyState/NoWorkspaces';
import styles from '@/pages/WorkspacesList/index.module.css';
import { buildRows, RowData } from '@/pages/WorkspacesList/Rows';
import WorkspacesListToolbar from '@/pages/WorkspacesList/Toolbar';
import { BrandingData } from '@/services/bootstrap/branding.constant';
import { buildGettingStartedLocation } from '@/services/helpers/location';
import { Workspace } from '@/services/workspace-adapter';

type Props = {
  branding: BrandingData;
  history: History;
  workspaces: Workspace[];
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
      {
        title: '',
        dataLabel: ' ',
        cellTransforms: [classNames(styles.actionsDropdownCell)],
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

  private buildRows(): RowData[] {
    const { workspaces } = this.props;
    const { filtered, selected, sortBy } = this.state;

    return buildRows(workspaces, [], filtered, selected, sortBy);
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

  private handleAddWorkspace(): void {
    const location = buildGettingStartedLocation();
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
  }

  public render(): React.ReactElement {
    const { workspaces } = this.props;
    const { workspace: workspacesDocsLink } = this.props.branding.docs;
    const { selected, isSelectedAll, sortBy } = this.state;
    const rows = this.buildRows();

    const toolbar = (
      <WorkspacesListToolbar
        selected={selected}
        workspaces={workspaces}
        selectedAll={isSelectedAll}
        onAddWorkspace={() => this.handleAddWorkspace()}
        onBulkDelete={async () => {
          // no-op
        }}
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
