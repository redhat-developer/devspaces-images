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

import {
  Button,
  Checkbox,
  InputGroup,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarToggleGroup,
} from '@patternfly/react-core';
import { EllipsisVIcon, PlusCircleIcon, SearchIcon } from '@patternfly/react-icons';
import React from 'react';

import { WorkspaceActionsConsumer } from '@/contexts/WorkspaceActions';
import { WorkspaceActionsBulkDeleteButton } from '@/contexts/WorkspaceActions/BulkDeleteButton';
import styles from '@/pages/WorkspacesList/Toolbar/index.module.css';
import match from '@/services/helpers/filter';
import { Workspace } from '@/services/workspace-adapter';

type Props = {
  selected: string[];
  selectedAll: boolean;
  workspaces: Workspace[];
  onAddWorkspace: () => void;
  onBulkDelete: () => Promise<void>;
  onFilter: (filtered: Workspace[]) => void;
  onToggleSelectAll: (checked: boolean) => void;
};
type State = {
  filterValue: string;
};

export default class WorkspacesListToolbar extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      filterValue: '',
    };
  }

  private handleKeyboardEvents(): void {
    const input = document.querySelector('#workspaces-filter-input') as HTMLInputElement;
    if (!input) {
      console.warn('Cannot attach listener: search input is not found.');
      return;
    }

    input.addEventListener('keydown', (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Enter':
          this.handleFilterApply();
          break;
        case 'Escape':
          this.handleFilterChange('');
          this.props.onFilter(this.props.workspaces);
          break;
        default:
          break;
      }
    });
  }

  private handleToggleSelectAll(isChecked: boolean): void {
    this.props.onToggleSelectAll(isChecked);
  }

  private handleFilterChange(filterValue: string): void {
    this.setState({
      filterValue,
    });
  }

  private filterWorkspaces(filterValue: string): Workspace[] {
    return this.props.workspaces.filter(workspace => match(workspace.name || '', filterValue));
  }

  private handleFilterApply(): void {
    const workspaces = this.filterWorkspaces(this.state.filterValue);
    this.props.onFilter(workspaces);
  }

  private async handleBulkDelete(): Promise<void> {
    return this.props.onBulkDelete();
  }

  private handleAddWorkspace(): void {
    this.props.onAddWorkspace();
  }

  public componentDidMount(): void {
    this.handleKeyboardEvents();
  }

  public render(): React.ReactElement {
    const { workspaces, selected, selectedAll } = this.props;
    const { filterValue } = this.state;

    const workspacesSelected = workspaces.filter(workspace => selected.includes(workspace.uid));

    const isDeleteDisabled = workspacesSelected.length === 0;

    const checkboxItem = (
      <ToolbarItem variant="bulk-select" className={styles.toolbarCheckbox}>
        <Checkbox
          isChecked={selectedAll}
          onChange={isChecked => this.handleToggleSelectAll(isChecked)}
          aria-label="Toggle: select all workspaces"
          id="toggle-select-all-workspaces"
          name="toggle-select-all-workspaces"
        />
      </ToolbarItem>
    );
    const filterItem = (
      <ToolbarItem variant="search-filter">
        <InputGroup>
          <TextInput
            name="workspaces-filter-input"
            id="workspaces-filter-input"
            type="search"
            aria-label="Filter workspaces input"
            placeholder="Search"
            value={filterValue}
            onChange={value => this.handleFilterChange(value)}
          />
          <Button
            variant="control"
            aria-label="Filter workspaces"
            onClick={() => this.handleFilterApply()}
          >
            <SearchIcon />
          </Button>
        </InputGroup>
      </ToolbarItem>
    );
    const actionItems = (
      <ToolbarToggleGroup
        className={styles.toolbarToggleGroup}
        breakpoint="md"
        toggleIcon={<EllipsisVIcon />}
      >
        <ToolbarItem>
          <WorkspaceActionsConsumer>
            {context => {
              return (
                <WorkspaceActionsBulkDeleteButton
                  context={context}
                  isDisabled={isDeleteDisabled}
                  workspaces={workspacesSelected}
                  onAction={async () => this.handleBulkDelete()}
                />
              );
            }}
          </WorkspaceActionsConsumer>
        </ToolbarItem>
        <ToolbarItem
          alignment={{ md: 'alignRight', lg: 'alignRight', xl: 'alignRight', '2xl': 'alignRight' }}
        >
          <Button
            variant="link"
            aria-label="Add a new workspace"
            icon={<PlusCircleIcon />}
            iconPosition="left"
            onClick={() => this.handleAddWorkspace()}
          >
            Add Workspace
          </Button>
        </ToolbarItem>
      </ToolbarToggleGroup>
    );

    return (
      <Toolbar id="workspaces-list-table-toolbar">
        <ToolbarContent>
          {checkboxItem}
          {filterItem}
          {actionItems}
        </ToolbarContent>
      </Toolbar>
    );
  }
}
