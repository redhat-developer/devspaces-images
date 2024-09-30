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
  ButtonVariant,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  FormHelperText,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
  TextInput,
  Title,
  ValidatedOptions,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { History } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { validateLocation } from '@/components/ImportFromGit/helpers';
import RepoOptionsAccordion from '@/components/ImportFromGit/RepoOptionsAccordion';
import UntrustedSourceModal from '@/components/UntrustedSourceModal';
import { FactoryLocationAdapter } from '@/services/factory-location-adapter';
import { EDITOR_ATTR, EDITOR_IMAGE_ATTR } from '@/services/helpers/factoryFlow/buildFactoryParams';
import { buildUserPreferencesLocation } from '@/services/helpers/location';
import { UserPreferencesTab } from '@/services/helpers/types';
import { AppState } from '@/store';
import { selectSshKeys } from '@/store/SshKeys/selectors';
import * as WorkspacesStore from '@/store/Workspaces';

const FIELD_ID = 'git-repo-url';

export type Props = MappedProps & {
  history: History;
  editorDefinition: string | undefined;
  editorImage: string | undefined;
};
export type State = {
  hasSshKeys: boolean;
  location: string;
  locationValidated: ValidatedOptions;
  remotesValidated: ValidatedOptions;
  isFocused: boolean;
  isConfirmationOpen: boolean;
};

class ImportFromGit extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasSshKeys: this.props.sshKeys.length > 0,
      locationValidated: ValidatedOptions.default,
      location: '',
      remotesValidated: ValidatedOptions.default,
      isFocused: false,
      isConfirmationOpen: false,
    };
  }

  public componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
    const { location, isFocused } = this.state;
    if (!isFocused && (location !== prevState.location || prevState.isFocused)) {
      const inputElement = document.getElementById(FIELD_ID) as HTMLInputElement;
      if (inputElement) {
        inputElement.value = location;
      }
    }
  }

  private openConfirmationDialog(): void {
    this.setState({ isConfirmationOpen: true });
  }

  private handleConfirmationOnClose(): void {
    this.setState({ isConfirmationOpen: false });
  }

  private handleConfirmationOnContinue(): void {
    this.setState({ isConfirmationOpen: false });
    this.startFactory();
  }

  private handleCreate(): void {
    this.openConfirmationDialog();
  }

  private startFactory(): void {
    const { editorDefinition, editorImage } = this.props;
    const factory = new FactoryLocationAdapter(this.state.location);

    // add the editor definition and editor image to the URL
    // if they are not already there
    if (!factory.searchParams.has(EDITOR_ATTR) && !factory.searchParams.has(EDITOR_IMAGE_ATTR)) {
      if (editorDefinition !== undefined) {
        factory.searchParams.set(EDITOR_ATTR, editorDefinition);
      }
      if (editorImage !== undefined) {
        factory.searchParams.set(EDITOR_IMAGE_ATTR, editorImage);
      }
    }

    // open a new page to handle that
    window.open(`${window.location.origin}/#${factory.toString()}`, '_blank');
  }

  private handleChange(location: string): void {
    location = location.trim();
    if (this.state.location === location) {
      return;
    }
    const validated = validateLocation(location, this.state.hasSshKeys);
    this.setState({ locationValidated: validated, location });
  }

  private getErrorMessage(location: string): string | React.ReactNode {
    const isValidGitSsh = FactoryLocationAdapter.isSshLocation(location);

    if (isValidGitSsh && !this.state.hasSshKeys) {
      return (
        <FormHelperText icon={<ExclamationCircleIcon />} isHidden={false} isError={true}>
          No SSH keys found. Please add your SSH keys in the{' '}
          <Button variant="link" isInline onClick={() => this.openUserPreferences()}>
            User Preferences
          </Button>{' '}
          and then try again.
        </FormHelperText>
      );
    }

    return 'The URL or SSHLocation is not valid.';
  }

  private openUserPreferences(): void {
    const location = buildUserPreferencesLocation(UserPreferencesTab.SSH_KEYS);
    this.props.history.push(location);
  }

  public buildForm(): React.JSX.Element {
    const { location } = this.state;
    const { locationValidated, remotesValidated } = this.state;

    const buttonDisabled =
      !location ||
      locationValidated === ValidatedOptions.error ||
      remotesValidated === ValidatedOptions.error;
    const errorMessage = this.getErrorMessage(location);
    const validated =
      remotesValidated === ValidatedOptions.error ? ValidatedOptions.error : locationValidated;

    return (
      <Form
        isHorizontal={true}
        onSubmit={e => {
          e.preventDefault();
          if (buttonDisabled) {
            return false;
          }
          this.handleCreate();
        }}
      >
        <FormGroup
          fieldId={FIELD_ID}
          label="Git repo URL"
          isRequired={true}
          validated={validated}
          helperTextInvalid={errorMessage}
          helperTextInvalidIcon={<ExclamationCircleIcon />}
          helperText="Import from a Git repository to create your first workspace."
        >
          <Flex>
            <FlexItem grow={{ default: 'grow' }} style={{ maxWidth: '500px', minWidth: '70%' }}>
              <TextInput
                id={FIELD_ID}
                aria-label="HTTPS or SSH URL"
                placeholder="Enter HTTPS or SSH URL"
                validated={validated}
                onFocus={() => this.setState({ isFocused: true })}
                onBlur={() => this.setState({ isFocused: false })}
                onChange={value => this.handleChange(value)}
              />
            </FlexItem>
            <FlexItem>
              <Button
                id="create-and-open-button"
                isDisabled={buttonDisabled}
                variant={ButtonVariant.secondary}
                onClick={() => this.handleCreate()}
              >
                Create & Open
              </Button>
            </FlexItem>
          </Flex>
        </FormGroup>
      </Form>
    );
  }

  public render() {
    const { history } = this.props;
    const { isConfirmationOpen, location, locationValidated } = this.state;
    return (
      <>
        <UntrustedSourceModal
          location={location}
          isOpen={isConfirmationOpen}
          onContinue={() => this.handleConfirmationOnContinue()}
          onClose={() => this.handleConfirmationOnClose()}
        />
        <Panel>
          <PanelHeader>
            <Title headingLevel="h3">Import from Git</Title>
          </PanelHeader>
          <PanelMain>
            <PanelMainBody>{this.buildForm()}</PanelMainBody>
          </PanelMain>
          {locationValidated === ValidatedOptions.success && (
            <PanelMain>
              <PanelMainBody>
                <RepoOptionsAccordion
                  location={location}
                  history={history}
                  onChange={(location: string, remotesValidated: ValidatedOptions) => {
                    const locationValidated = validateLocation(location, this.state.hasSshKeys);
                    this.setState({ location, remotesValidated, locationValidated });
                  }}
                />
              </PanelMainBody>
            </PanelMain>
          )}
        </Panel>
      </>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  sshKeys: selectSshKeys(state),
});

const connector = connect(mapStateToProps, WorkspacesStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(ImportFromGit);
