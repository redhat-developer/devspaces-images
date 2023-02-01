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
  ToolbarContent,
  ToolbarItem,
  Checkbox,
  Toolbar,
  Button,
  InputGroup,
  TextInput,
  ToolbarToggleGroup,
} from '@patternfly/react-core';
import { EllipsisVIcon, PlusCircleIcon, SearchIcon } from '@patternfly/react-icons';
import match from '../../../services/helpers/filter';

import styles from './index.module.css';
import { Workspace } from '../../../services/workspace-adapter';

type Props = {
  selectedAll: boolean;
  workspaces: Workspace[];
  enabledDelete: boolean;
  onAddWorkspace: () => void;
  onBulkDelete: () => Promise<void>;
  onFilter: (filtered: Workspace[]) => void;
  onToggleSelectAll: (checked: boolean) => void;
};
type State = {
  enabledDelete: boolean;
  selectedAll: boolean;
  filterValue: string;
};

export default class WorkspacesListToolbar extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      enabledDelete: this.props.enabledDelete,
      selectedAll: this.props.selectedAll,
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
    this.setState({
      selectedAll: isChecked,
    });
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
    this.props.onBulkDelete();
  }

  private handleAddWorkspace(): void {
    this.props.onAddWorkspace();
  }

  public componentDidMount(): void {
    this.handleKeyboardEvents();
  }

  public componentDidUpdate(prevProps: Props): void {
    if (
      this.props.selectedAll !== prevProps.selectedAll &&
      this.props.selectedAll !== this.state.selectedAll
    ) {
      this.setState({
        selectedAll: this.props.selectedAll,
      });
    }
    if (
      this.props.enabledDelete !== prevProps.enabledDelete &&
      this.props.enabledDelete !== this.state.enabledDelete
    ) {
      this.setState({
        enabledDelete: this.props.enabledDelete,
      });
    }
  }

  public render(): React.ReactElement {
    const { selectedAll, filterValue, enabledDelete } = this.state;

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
          <Button
            variant="primary"
            aria-label="Delete selected workspaces"
            isDisabled={enabledDelete === false}
            onClick={() => this.handleBulkDelete()}
          >
            Delete
          </Button>
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
