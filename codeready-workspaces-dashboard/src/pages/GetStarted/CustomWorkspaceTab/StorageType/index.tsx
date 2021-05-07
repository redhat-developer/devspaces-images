/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
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
  FormGroup,
  Button,
  Modal,
  ModalVariant,
  Select,
  SelectOption,
  SelectVariant,
  SelectDirection,
  TextContent,
  Text
} from '@patternfly/react-core';
import { connect, ConnectedProps } from 'react-redux';
import { AppState } from '../../../../store';
import { selectAvailableStorageTypes, selectPreferredStorageType } from '../../../../store/Workspaces/selectors';
import * as storageTypeService from '../../../../services/storageTypes';

import styles from './index.module.css';

type Props =
  MappedProps
  & {
    storageType?: che.WorkspaceStorageType;
    onChange?: (storageType: che.WorkspaceStorageType) => void;
  };
type State = {
  isOpen: boolean;
  selected: string;
  isModalOpen: boolean;
};

export class StorageTypeFormGroup extends React.PureComponent<Props, State> {
  storageTypes: che.WorkspaceStorageType[] = [];
  preferredType: che.WorkspaceStorageType;
  options: string[] = [];

  constructor(props: Props) {
    super(props);

    const availableTypes = this.props.availableStorageTypes;
    if (Array.isArray(availableTypes)) {
      this.storageTypes = availableTypes;
      this.storageTypes.forEach(type =>
        this.options.push(storageTypeService.toTitle(type))
      );
    }
    const preferredType = this.props.preferredStorageType;
    if (preferredType) {
      this.preferredType = preferredType;
    }

    this.state = {
      isOpen: false,
      isModalOpen: false,
      selected: '',
    };
  }

  public componentDidUpdate(prevProps: Props): void {
    if (prevProps.storageType !== this.props.storageType) {
      const selected = this.props.storageType ? storageTypeService.toTitle(this.props.storageType) : '';
      this.setState({ selected });
    }
  }

  public componentDidMount(): void {
    if (this.props.storageType) {
      this.setState({ selected: storageTypeService.toTitle(this.props.storageType) });
    } else {
      this.setState({ selected: storageTypeService.toTitle(this.preferredType) });
    }
  }

  private handleToggle(isOpen: boolean): void {
    this.setState({ isOpen });
  }

  private handleSelect(selectedTitle: string): void {
    if (this.props.onChange) {
      this.props.onChange(storageTypeService.fromTitle(selectedTitle));
    }
    this.setState({
      selected: selectedTitle,
      isOpen: false
    });
  }

  private handleModalToggle(): void {
    this.setState(({ isModalOpen }) => ({
      isModalOpen: !isModalOpen
    }));
  }

  private getModalContent(): React.ReactNode {
    const hasAsync = this.storageTypes.some(type => type === 'async');
    const asyncTypeDescr = hasAsync ?
      (<Text><span className={styles.experimentalStorageType}> Experimental feature </span><br />
        <b>Asynchronous Storage </b>
        is combination of Ephemeral and Persistent storages. It allows for faster I / O and keeps your changes,
        it does backup the workspace on stop and restores it on start.</Text>) : '';
    const hasPersistent = this.storageTypes.some(type => type === 'persistent');
    const persistentTypeDescr = hasPersistent ?
      (<Text><b>Persistent Storage</b> is slow I/O but persistent.</Text>) : '';
    const hasEphemeral = this.storageTypes.some(type => type === 'ephemeral');
    const ephemeralTypeDescr = hasEphemeral ?
      (<Text><b>Ephemeral Storage</b> allows for faster I/O but may have limited
        storage and is not persistent.</Text>) : '';
    const href = this.props.brandingStore.data.docs.storageTypes;

    return (<TextContent>
      {persistentTypeDescr}
      {ephemeralTypeDescr}
      {asyncTypeDescr}
      <Text><a rel="noreferrer" target="_blank" href={href}>Open documentation page</a></Text>
    </TextContent>);
  }

  public render(): React.ReactNode {
    const { isOpen, selected, isModalOpen } = this.state;

    return (
      <FormGroup
        label="Storage Type"
        fieldId="storage-type"
      >
        <Select
          className={styles.storageTypeSelector}
          aria-label="Storage Type Selector"
          aria-labelledby="storage-type-selector-id"
          variant={SelectVariant.single}
          direction={SelectDirection.down}
          toggleId="storage-type-toggle-button"
          onToggle={_isOpen => this.handleToggle(_isOpen)}
          onSelect={(event, selection) => this.handleSelect(selection as string)}
          selections={selected}
          isOpen={isOpen}
        >
          {this.options.map((option: string) => (
            <SelectOption
              key={option}
              value={option}
            />
          ))}
        </Select>
        <Button variant="link" onClick={() => this.handleModalToggle()}>
          Learn more about storage types
        </Button>
        <Modal
          variant={ModalVariant.small}
          isOpen={isModalOpen}
          aria-label="Storage types info"
          showClose={true}
          aria-describedby="storage-types-info"
          onClose={() => this.handleModalToggle()}
        >
          {this.getModalContent()}
        </Modal>
      </FormGroup>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  brandingStore: state.branding,
  availableStorageTypes: selectAvailableStorageTypes(state),
  preferredStorageType: selectPreferredStorageType(state),
});

const connector = connect(
  mapStateToProps,
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(StorageTypeFormGroup);
