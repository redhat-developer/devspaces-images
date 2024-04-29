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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
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

import { GitRepoOptions } from '@/components/ImportFromGit/GitRepoOptions';
import {
  getGitRepoOptionsFromLocation,
  setGitRepoOptionsToLocation,
  validateLocation,
} from '@/components/ImportFromGit/helpers';
import { GitRemote } from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/getGitRemotes';
import { FactoryLocationAdapter } from '@/services/factory-location-adapter';
import { EDITOR_ATTR, EDITOR_IMAGE_ATTR } from '@/services/helpers/factoryFlow/buildFactoryParams';
import { buildUserPreferencesLocation } from '@/services/helpers/location';
import { UserPreferencesTab } from '@/services/helpers/types';
import { AppState } from '@/store';
import { selectSshKeys } from '@/store/SshKeys/selectors';
import * as WorkspacesStore from '@/store/Workspaces';

type AccordionId = 'options';

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
  expandedId: AccordionId | undefined;
  gitBranch: string | undefined;
  remotes: GitRemote[] | undefined;
  remotesValidated: ValidatedOptions;
  devfilePath: string | undefined;
  isFocused: boolean;
  hasSupportedGitService: boolean;
};

class ImportFromGit extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasSshKeys: this.props.sshKeys.length > 0,
      locationValidated: ValidatedOptions.default,
      location: '',
      expandedId: undefined,
      gitBranch: undefined,
      remotes: undefined,
      remotesValidated: ValidatedOptions.default,
      devfilePath: undefined,
      isFocused: false,
      hasSupportedGitService: false,
    };
  }

  public componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
    const { location, isFocused } = this.state;
    if (!isFocused && (location !== prevState.location || prevState.isFocused)) {
      const inputElement = document.getElementById(FIELD_ID) as HTMLInputElement;
      if (inputElement) {
        inputElement.value = decodeURIComponent(location);
      }
    }
  }

  private handleCreate(): void {
    const { editorDefinition, editorImage } = this.props;
    const { location } = this.state;

    const factory = new FactoryLocationAdapter(location);

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
    if (this.state.location === location.trim()) {
      return;
    }
    const validated = validateLocation(location, this.state.hasSshKeys);
    this.setState({ locationValidated: validated, location });
    if (validated !== ValidatedOptions.success) {
      return;
    }
    this.setState(getGitRepoOptionsFromLocation(location) as State);
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
    const location = decodeURIComponent(this.state.location);
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

  private handleToggle(id: AccordionId): void {
    const { expandedId } = this.state;
    this.setState({
      expandedId: expandedId === id ? undefined : id,
    });
  }

  private handleGitRepoOptionsChange(
    gitBranch: string | undefined,
    remotes: GitRemote[] | undefined,
    devfilePath: string | undefined,
    isValid: boolean,
  ): void {
    const state = setGitRepoOptionsToLocation(
      { gitBranch, remotes, devfilePath },
      {
        location: this.state.location,
        gitBranch: this.state.gitBranch,
        remotes: this.state.remotes,
        devfilePath: this.state.devfilePath,
      },
    ) as State;
    state.remotesValidated = isValid ? ValidatedOptions.success : ValidatedOptions.error;
    this.setState(state);
  }

  public buildGitRepoOptions(): React.JSX.Element {
    const { expandedId, remotes, devfilePath, gitBranch, hasSupportedGitService } = this.state;

    return (
      <Accordion asDefinitionList={false}>
        <AccordionItem>
          <AccordionToggle
            onClick={() => {
              this.handleToggle('options');
            }}
            isExpanded={expandedId === 'options'}
            id="accordion-item-options"
          >
            Git Repo Options
          </AccordionToggle>

          <AccordionContent isHidden={expandedId !== 'options'} data-testid="options-content">
            <Panel>
              <PanelMain>
                <PanelMainBody>
                  <GitRepoOptions
                    gitBranch={gitBranch}
                    remotes={remotes}
                    devfilePath={devfilePath}
                    hasSupportedGitService={hasSupportedGitService}
                    onChange={(gitBranch, remotes, devfilePath, isValid) =>
                      this.handleGitRepoOptionsChange(gitBranch, remotes, devfilePath, isValid)
                    }
                  />
                </PanelMainBody>
              </PanelMain>
            </Panel>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  public render() {
    const { locationValidated } = this.state;
    return (
      <Panel>
        <PanelHeader>
          <Title headingLevel="h3">Import from Git</Title>
        </PanelHeader>
        <PanelMain>
          <PanelMainBody>{this.buildForm()}</PanelMainBody>
        </PanelMain>
        {locationValidated === ValidatedOptions.success && (
          <PanelMain>
            <PanelMainBody>{this.buildGitRepoOptions()}</PanelMainBody>
          </PanelMain>
        )}
      </Panel>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  sshKeys: selectSshKeys(state),
});

const connector = connect(mapStateToProps, WorkspacesStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(ImportFromGit);
