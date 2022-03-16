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

import React from 'react';
import {
  FormGroup,
  Button,
  Modal,
  ModalVariant,
  TextVariants,
  TextContent,
  Text,
  Radio,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';
import { AppState } from '../../../../store';
import { connect, ConnectedProps } from 'react-redux';
import { OutlinedQuestionCircleIcon, PencilAltIcon } from '@patternfly/react-icons';
import {
  selectAvailableStorageTypes,
  selectPreferredStorageType,
} from '../../../../store/Workspaces/Settings/selectors';
import * as storageTypeService from '../../../../services/storageTypes';
import { selectBranding } from '../../../../store/Branding/selectors';

import overviewStyles from '../index.module.css';
import styles from './index.module.css';

export type Props = MappedProps & {
  readonly: boolean;
  storageType?: che.WorkspaceStorageType;
  onSave?: (storageType: che.WorkspaceStorageType) => void;
};
export type State = {
  isSelectorOpen?: boolean;
  selected?: che.WorkspaceStorageType;
  isInfoOpen?: boolean;
};

export class StorageTypeFormGroup extends React.PureComponent<Props, State> {
  storageTypes: che.WorkspaceStorageType[] = [];
  options: string[] = [];
  preferredType: che.WorkspaceStorageType;

  constructor(props: Props) {
    super(props);

    this.state = {
      isSelectorOpen: false,
      isInfoOpen: false,
    };

    const availableTypes = this.props.availableStorageTypes;
    if (Array.isArray(availableTypes)) {
      this.storageTypes = availableTypes;
      this.storageTypes.forEach(type => this.options.push(storageTypeService.toTitle(type)));
    }
    const preferredType = this.props.preferredStorageType;
    if (preferredType) {
      this.preferredType = preferredType;
    }
  }

  public componentDidUpdate(prevProps: Props): void {
    if (prevProps.storageType !== this.props.storageType) {
      const selected = this.props.storageType;
      this.setState({ selected });
    }
  }

  public componentDidMount(): void {
    const selected = this.props.storageType ? this.props.storageType : this.preferredType;
    this.setState({ selected });
  }

  private handleEditToggle(isSelectorOpen: boolean): void {
    this.setState({ isSelectorOpen });
  }

  private handleInfoToggle(): void {
    this.setState(({ isInfoOpen }) => ({
      isInfoOpen: !isInfoOpen,
    }));
  }

  private getExistingTypes(): { hasAsync: boolean; hasPersistent: boolean; hasEphemeral: boolean } {
    const hasAsync = this.storageTypes.some(type => type === 'async');
    const hasPersistent = this.storageTypes.some(type => type === 'persistent');
    const hasEphemeral = this.storageTypes.some(type => type === 'ephemeral');

    return { hasAsync, hasPersistent, hasEphemeral };
  }

  private getInfoModalContent(): React.ReactNode {
    const { hasAsync, hasPersistent, hasEphemeral } = this.getExistingTypes();

    const asyncTypeDescr = hasAsync ? (
      <Text>
        <span className={styles.experimentalStorageType}> Experimental feature </span>
        <br />
        <b>Asynchronous Storage </b>
        is combination of Ephemeral and Persistent storages. It allows for faster I / O and keeps
        your changes, it does backup the workspace on stop and restores it on start.
      </Text>
    ) : (
      ''
    );
    const persistentTypeDescr = hasPersistent ? (
      <Text>
        <b>Persistent Storage</b> is slow I/O but persistent.
      </Text>
    ) : (
      ''
    );
    const ephemeralTypeDescr = hasEphemeral ? (
      <Text>
        <b>Ephemeral Storage</b> allows for faster I/O but may have limited storage and is not
        persistent.
      </Text>
    ) : (
      ''
    );
    const href = this.props.branding.docs.storageTypes;

    return (
      <TextContent>
        {persistentTypeDescr}
        {ephemeralTypeDescr}
        {asyncTypeDescr}
        <Text>
          <a rel="noreferrer" target="_blank" href={href}>
            Open documentation page
          </a>
        </Text>
      </TextContent>
    );
  }

  private getSelectorModal(): React.ReactNode {
    const { hasAsync, hasPersistent, hasEphemeral } = this.getExistingTypes();
    const { isSelectorOpen, selected } = this.state;
    const originSelection = this.props.storageType ? this.props.storageType : this.preferredType;

    const asyncTypeDescr = hasAsync ? (
      <Text component={TextVariants.h6}>
        <Radio
          label="Asynchronous"
          name="asynchronous"
          id="async-type-radio"
          description={`Asynchronous this is combination of Ephemeral and Persistent storage. Allows for faster I/O
         and keeps your changes, will backup on stop and restores on start.`}
          isChecked={selected === 'async'}
          onChange={() => this.setState({ selected: 'async' })}
        />
      </Text>
    ) : (
      ''
    );
    const persistentTypeDescr = hasPersistent ? (
      <Text component={TextVariants.h6}>
        <Radio
          label="Persistent"
          name="persistent"
          id="persistent-type-radio"
          description="Persistent Storage slow I/O but persistent."
          isChecked={selected === 'persistent'}
          onChange={() => this.setState({ selected: 'persistent' })}
        />
      </Text>
    ) : (
      ''
    );
    const ephemeralTypeDescr = hasEphemeral ? (
      <Text component={TextVariants.h6}>
        <Radio
          label="Ephemeral"
          name="ephemeral"
          id="ephemeral-type-radio"
          description="Ephemeral Storage allows for faster I/O but may have limited storage and is not persistent."
          isChecked={selected === 'ephemeral'}
          onChange={() => this.setState({ selected: 'ephemeral' })}
        />
      </Text>
    ) : (
      ''
    );

    return (
      <Modal
        variant={ModalVariant.small}
        isOpen={isSelectorOpen}
        className={styles.modalEditStorageType}
        title="Edit Storage Type"
        onClose={() => this.handleCancelChanges()}
        actions={[
          <Button
            key="confirm"
            variant="primary"
            isDisabled={originSelection === selected}
            onClick={() => this.handleConfirmChanges()}
          >
            Save
          </Button>,
          <Button key="cancel" variant="secondary" onClick={() => this.handleCancelChanges()}>
            Cancel
          </Button>,
        ]}
      >
        <TextContent>
          <Alert
            variant={AlertVariant.warning}
            className={styles.warningAlert}
            title="Note that after changing the storage type you may lose workspace data."
            isInline
          />
          <Text component={TextVariants.h6}>Select the storage type</Text>
          {persistentTypeDescr}
          {ephemeralTypeDescr}
          {asyncTypeDescr}
        </TextContent>
      </Modal>
    );
  }

  private handleConfirmChanges(): void {
    const selection = this.state.selected as che.WorkspaceStorageType;
    if (this.props.onSave) {
      this.props.onSave(selection);
    }
    this.setState({
      selected: selection,
      isSelectorOpen: false,
    });
  }

  private handleCancelChanges(): void {
    const originSelection = this.props.storageType ? this.props.storageType : this.preferredType;
    this.setState({ selected: originSelection });
    this.handleEditToggle(false);
  }

  public render(): React.ReactNode {
    const { readonly } = this.props;
    const { selected, isInfoOpen } = this.state;

    return (
      <FormGroup
        label="Storage Type"
        fieldId="storage-type"
        labelIcon={
          <Button
            variant="plain"
            onClick={() => this.handleInfoToggle()}
            className={styles.labelIcon}
          >
            <OutlinedQuestionCircleIcon />
          </Button>
        }
      >
        {readonly && <span className={overviewStyles.readonly}>{selected}</span>}
        {!readonly && (
          <span className={overviewStyles.editable}>
            {selected}
            <Button
              data-testid="overview-storage-edit-toggle"
              variant="plain"
              onClick={() => this.handleEditToggle(true)}
            >
              <PencilAltIcon />
            </Button>
          </span>
        )}
        {this.getSelectorModal()}
        <Modal
          title="Storage Type info"
          variant={ModalVariant.small}
          isOpen={isInfoOpen}
          onClose={() => {
            this.handleInfoToggle();
          }}
        >
          {this.getInfoModalContent()}
        </Modal>
      </FormGroup>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  branding: selectBranding(state),
  availableStorageTypes: selectAvailableStorageTypes(state),
  preferredStorageType: selectPreferredStorageType(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(StorageTypeFormGroup);
