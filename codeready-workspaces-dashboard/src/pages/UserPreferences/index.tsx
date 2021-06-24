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

import {
  AlertVariant,
  Button,
  ButtonVariant,
  PageSection,
  PageSectionVariants,
  Tab,
  Tabs,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { Table, TableBody, TableHeader } from '@patternfly/react-table';
import { History } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import Head from '../../components/Head';
import CheProgress from '../../components/Progress';
import { lazyInject } from '../../inversify.config';
import { AppAlerts } from '../../services/alerts/appAlerts';
import { AlertItem } from '../../services/helpers/types';
import { ROUTE } from '../../route.enum';
import { AppState } from '../../store';
import * as UserPreferencesStore from '../../store/UserPreferences';
import { RegistryRow } from '../../store/UserPreferences/types';
import { selectIsLoading, selectPreferences, selectRegistries } from '../../store/UserPreferences/selectors';
import NoRegistriesEmptyState from './EmptyState/NoRegistries';
import DeleteRegistriesModal from './Modals/DeleteRegistriesModal';
import EditRegistryModal from './Modals/EditRegistryModal';

const CONTAINER_REGISTRIES_TAB_KEY = 'container-registries';

type Props = {
  history: History;
} & MappedProps;

type State = {
  selectedItems: string[];
  registries: RegistryRow[];
  currentRegistry: RegistryRow;
  currentRegistryIndex: number;
  isDeleteModalOpen: boolean;
  isEditModalOpen: boolean;
  activeTabKey: string;
}

export class UserPreferences extends React.PureComponent<Props, State> {

  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    const registries = this.props.registries;

    this.state = {
      registries,
      currentRegistry: { url: '', password: '', username: '' },
      selectedItems: [],
      activeTabKey: CONTAINER_REGISTRIES_TAB_KEY,
      currentRegistryIndex: -1,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
    };
  }

  private onChangeRegistrySelection(isSelected: boolean, rowIndex: number) {
    let registries = [...this.state.registries];
    if (rowIndex === -1) {
      registries = registries.map(registry => {
        return registry;
      });
      const selectedItems = isSelected ? registries.map(registry => registry.url) : [];
      this.setState({ registries, selectedItems });
    } else {
      const url = registries[rowIndex].url;
      this.setState((prevState: State) => {
        return {
          registries,
          selectedItems: isSelected
            ? [...prevState.selectedItems, url]
            : prevState.selectedItems.filter(itemUrl => itemUrl !== url),
        };
      });
    }
  }

  public componentDidMount(): void {
    const { preferences, isLoading, requestUserPreferences } = this.props;
    if (!isLoading && !preferences.dockerCredentials) {
      requestUserPreferences(undefined);
    }
  }

  public componentDidUpdate(prevProps: Props, prevState: State): void {
    if (prevProps.preferences.dockerCredentials !== this.props.preferences.dockerCredentials) {
      const registries = this.props.registries;
      const selectedItems: string[] = [];
      this.state.selectedItems.forEach(item => {
        if (registries.find(registry => registry.url === item) !== undefined) {
          selectedItems.push(item);
        }
      });
      this.setState({ registries, selectedItems });
    }
    if (prevState.currentRegistryIndex !== this.state.currentRegistryIndex) {
      const currentRegistry = this.getCurrentRegistry();
      this.setState({ currentRegistry });
    }
  }

  private showAlert(alert: AlertItem): void {
    this.appAlerts.showAlert(alert);
  }

  private handleTabClick(activeTabKey: string): void {
    this.props.history.push(`${ROUTE.USER_PREFERENCES}?tab=${activeTabKey}`);
    this.setState({ activeTabKey });
  }

  private buildRegistryRow(registry: RegistryRow): React.ReactNode[] {
    const { url, username } = registry;

    if (/^http[s]?:\/\/.*/.test(url)) {
      return [
        <span key="host">
          <a href={url} target="_blank" rel="noreferrer">{url}</a>
        </span>,
        <span key="username">{username}</span>,
      ];
    }

    return [
      <span key="host">{url}</span>,
      <span key="username">{username}</span>,
    ];
  }

  private showOnAddRegistryModal(): void {
    this.setState({ currentRegistryIndex: -1, isEditModalOpen: true });
  }

  private showOnEditRegistryModal(rowIndex: number): void {
    this.setState({ currentRegistryIndex: rowIndex, isEditModalOpen: true });
  }

  private showOnDeleteRegistryModal(rowIndex: number): void {
    this.setState({ currentRegistryIndex: rowIndex, isDeleteModalOpen: true });
  }

  private async onDelete(registry?: RegistryRow): Promise<void> {
    let registries: RegistryRow[];
    if (registry === undefined) {
      registries = this.state.registries.filter(registry => !this.state.selectedItems.includes(registry.url));
    } else {
      registries = [...this.state.registries];
      const index = registries.findIndex(_registry => _registry.url === registry.url);
      if (index > -1) {
        registries.splice(index, 1);
      } else {
        this.showAlert({
          key: 'delete-registry-fail',
          variant: AlertVariant.danger,
          title: 'Unable to find the target registry.',
        });
        return;
      }
    }
    this.setState({ isDeleteModalOpen: false, currentRegistryIndex: -1 });
    try {
      if (!registry) {
        this.setState({ selectedItems: [] });
      }
      await this.props.updateContainerRegistries(registries);
      this.showAlert({
        key: 'delete-success',
        variant: AlertVariant.success,
        title: `Registr${registry ? 'y' : 'ies'} successfully deleted.`,
      });
    } catch (e) {
      this.showAlert({
        key: 'delete-fail',
        variant: AlertVariant.danger,
        title: `Unable to delete the registr${registry ? 'y' : 'ies'}. ${e}`,
      });
    }
  }

  private setEditModalStatus(isEditModalOpen: boolean): void {
    if (this.state.isEditModalOpen === isEditModalOpen) {
      return;
    }
    this.setState({ isEditModalOpen });
  }

  private setDeleteModalStatus(isDeleteModalOpen: boolean): void {
    if (this.state.isDeleteModalOpen === isDeleteModalOpen) {
      return;
    }
    this.setState({ isDeleteModalOpen });
  }

  private handleDelete(): void {
    this.setState({ currentRegistryIndex: -1, isDeleteModalOpen: true });
  }

  private async onRegistriesChange(registries: RegistryRow[]): Promise<void> {
    const isEditMode = this.isEditMode;
    this.setState({ isEditModalOpen: false, currentRegistryIndex: -1 });
    try {
      await this.props.updateContainerRegistries(registries);
      this.showAlert({
        key: 'edit-registry-success',
        variant: AlertVariant.success,
        title: `Registry successfully ${isEditMode ? 'saved' : 'added'}.`,
      });
    } catch (e) {
      this.showAlert({
        key: 'edit-registry-fail',
        variant: AlertVariant.danger,
        title: `Unable to ${isEditMode ? 'save' : 'add'} the registry. ${e}`,
      });
    }
  }

  private get isEditMode(): boolean {
    const { registries } = this.props;
    const { currentRegistryIndex } = this.state;
    return currentRegistryIndex > -1 && currentRegistryIndex < registries.length;
  }

  private getCurrentRegistry(): RegistryRow {
    const { registries } = this.props;
    const { currentRegistryIndex } = this.state;
    const isEditMode = this.isEditMode;

    if (isEditMode) {
      return Object.assign({}, registries[currentRegistryIndex]);
    }
    return {
      url: '',
      password: '',
      username: '',
    };
  }

  private handleRegistryChange(editRegistry: RegistryRow): void {
    const { registries } = this.props;
    const { currentRegistryIndex } = this.state;
    if (this.isEditMode) {
      registries[currentRegistryIndex] = editRegistry;
    } else {
      registries.push(editRegistry);
    }

    this.onRegistriesChange(registries);
  }

  render(): React.ReactNode {
    const { isLoading } = this.props;
    const { isEditModalOpen, isDeleteModalOpen, currentRegistry, currentRegistryIndex, selectedItems } = this.state;
    const columns = ['Host', 'Username'];
    const rows = this.state.registries.map(registry => ({
      cells: this.buildRegistryRow(registry),
      selected: selectedItems.includes(registry.url),
    })) || [];
    const actions = [
      { title: 'Edit registry', onClick: (event, rowIndex) => this.showOnEditRegistryModal(rowIndex) },
      { title: 'Delete registry', onClick: (event, rowIndex) => this.showOnDeleteRegistryModal(rowIndex) },
    ];

    return (
      <React.Fragment>
        <Head pageName="User Preferences" />
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel={'h1'}>User Preferences</Title>
        </PageSection>
        <Tabs
          id="user-preferences-tabs"
          style={{ backgroundColor: 'var(--pf-global--BackgroundColor--100)' }}
          activeKey={this.state.activeTabKey}
          onSelect={(event, tabKey) => this.handleTabClick(tabKey as string)}>
          <Tab id="container-registries-tab" eventKey={CONTAINER_REGISTRIES_TAB_KEY} title="Container Registries">
            <CheProgress isLoading={isLoading} />
            <EditRegistryModal
              onCancel={() => this.setEditModalStatus(false)}
              onChange={_registry => this.handleRegistryChange(_registry)}
              isEditMode={this.isEditMode}
              registry={currentRegistry}
              isOpen={isEditModalOpen} />
            <PageSection>
              {rows.length === 0 ?
                (<NoRegistriesEmptyState onAddRegistry={() => this.showOnAddRegistryModal()} />) :
                (<React.Fragment>
                  <DeleteRegistriesModal
                    selectedItems={selectedItems}
                    onCancel={() => this.setDeleteModalStatus(false)}
                    onDelete={_registry => this.onDelete(_registry)}
                    isOpen={isDeleteModalOpen}
                    registry={currentRegistryIndex !== -1 ? currentRegistry : undefined} />
                  <Toolbar id="registries-list-toolbar" className="pf-m-page-insets">
                    <ToolbarContent>
                      <ToolbarItem>
                        <Button variant={ButtonVariant.danger} isDisabled={this.state.selectedItems.length === 0}
                          data-testid="bulk-delete-button"
                          onClick={() => this.handleDelete()}>
                          Delete
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem
                        alignment={{ md: 'alignRight', lg: 'alignRight', xl: 'alignRight', '2xl': 'alignRight' }}
                      >
                        <Button variant={ButtonVariant.link} data-testid="add-button"
                          icon={<PlusCircleIcon />}
                          iconPosition="left"
                          onClick={() => this.showOnAddRegistryModal()}>
                          Add Container Registry
                        </Button>
                      </ToolbarItem>
                    </ToolbarContent>
                  </Toolbar>
                  <Table cells={columns} actions={actions} rows={rows}
                    onSelect={(event, isSelected, rowIndex) => {
                      this.onChangeRegistrySelection(isSelected, rowIndex);
                    }}
                    canSelectAll={true} aria-label="Container credentials" variant="compact">
                    <TableHeader />
                    <TableBody />
                  </Table>
                </React.Fragment>)}
            </PageSection>
          </Tab>
        </Tabs>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  preferences: selectPreferences(state),
  registries: selectRegistries(state),
  isLoading: selectIsLoading(state),
});

const connector = connect(
  mapStateToProps,
  UserPreferencesStore.actionCreators,
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(UserPreferences);
