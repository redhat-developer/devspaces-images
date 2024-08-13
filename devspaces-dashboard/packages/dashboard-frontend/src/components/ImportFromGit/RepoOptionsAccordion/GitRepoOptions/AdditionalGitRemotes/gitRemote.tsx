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
  FormGroup,
  FormHelperText,
  TextInput,
  ValidatedOptions,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { CheTooltip } from '@/components/CheTooltip';
import { validateBrName, validateLocation } from '@/components/ImportFromGit/helpers';
import styles from '@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions/AdditionalGitRemotes/index.module.css';
import { GitRemote } from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/getGitRemotes';
import { ROUTE } from '@/Routes/routes';
import { FactoryLocationAdapter } from '@/services/factory-location-adapter';
import { UserPreferencesTab } from '@/services/helpers/types';
import { AppState } from '@/store';
import { selectSshKeys } from '@/store/SshKeys/selectors';
import * as WorkspacesStore from '@/store/Workspaces';

export type Props = MappedProps & {
  onDelete: () => void;
  onChange: (remote: GitRemote) => void;
  remote: GitRemote;
  callbacks: {
    getValidation?: () => boolean;
  };
};
export type State = {
  name: string;
  nameValidated: ValidatedOptions;
  url: string;
  urlValidated: ValidatedOptions;
};

class AdditionalGitRemote extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const {
      remote: { name, url },
    } = this.props;

    const nameValidated =
      name === '' && url === '' ? ValidatedOptions.default : this.validateName(name);
    const urlValidated =
      name === '' && url === '' ? ValidatedOptions.default : this.validateUrl(url);

    this.state = {
      name,
      nameValidated,
      url,
      urlValidated,
    };

    this.props.callbacks.getValidation = () =>
      nameValidated !== ValidatedOptions.error && urlValidated !== ValidatedOptions.error;
  }

  public componentDidUpdate(prevProps: Readonly<Props>): void {
    const {
      remote: { name, url },
    } = this.props;
    const _name = prevProps.remote.name;
    const _url = prevProps.remote.url;

    let { nameValidated, urlValidated } = this.state;

    if (name !== _name) {
      nameValidated = this.validateName(name);
      this.setState({
        name,
        nameValidated,
      });
    }

    if (url !== _url) {
      urlValidated = this.validateUrl(url);
      this.setState({
        url,
        urlValidated,
      });
    }

    if (url !== _url || name !== _name) {
      this.onChange(name, nameValidated, url, urlValidated);
    }
  }

  private onChange(
    name: string,
    nameValidated: ValidatedOptions,
    url: string,
    urlValidated: ValidatedOptions,
  ): void {
    this.props.callbacks.getValidation = () =>
      nameValidated !== ValidatedOptions.error && urlValidated !== ValidatedOptions.error;
    this.props.onChange({ url, name });
  }

  private validateUrl(url: string): ValidatedOptions {
    return validateLocation(url, this.props.sshKeys.length > 0);
  }

  private validateName(name: string): ValidatedOptions {
    return validateBrName(name);
  }

  private handleChange(_name: string | undefined, _url: string | undefined): void {
    let { name, nameValidated, url, urlValidated } = this.state;

    if (_name !== undefined) {
      name = _name.trim();
      nameValidated = this.validateName(name);
      this.setState({ name, nameValidated });
    }

    if (_url !== undefined) {
      url = _url.trim();
      urlValidated = this.validateUrl(url);
      this.setState({ url, urlValidated });
    }

    this.onChange(name, nameValidated, url, urlValidated);
  }

  private getErrorMessage(location: string): string | React.ReactNode {
    const isValidGitSsh = FactoryLocationAdapter.isSshLocation(location);

    if (isValidGitSsh && this.props.sshKeys.length === 0) {
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
    window.location.href = `${window.location.origin}/dashboard/#${ROUTE.USER_PREFERENCES}?tab=${UserPreferencesTab.SSH_KEYS}`;
  }

  public render() {
    const { urlValidated, nameValidated } = this.state;
    let { name, url } = this.state;
    const errorMessage = this.getErrorMessage(url);

    return (
      <Flex>
        <FlexItem align={{ default: 'alignRight' }}>
          <FormGroup
            label="Remote Name"
            isRequired
            className={styles.remoteName}
            validated={nameValidated}
            helperTextInvalid="The remote name is not valid."
          >
            <TextInput
              aria-label="Remote Name"
              placeholder="origin"
              onChange={_name => {
                name = _name;
                this.handleChange(name, undefined);
              }}
              validated={nameValidated}
              value={name}
            />
          </FormGroup>
        </FlexItem>
        <FlexItem grow={{ default: 'grow' }} align={{ default: 'alignRight' }}>
          <FormGroup
            label="Remote URL"
            isRequired
            className={styles.remoteURL}
            validated={urlValidated}
            helperTextInvalid={errorMessage}
          >
            <TextInput
              isRequired
              aria-label="Remote URL"
              placeholder="HTTP or SSH URL"
              onChange={_url => {
                url = _url;
                this.handleChange(undefined, url);
              }}
              validated={urlValidated}
              value={url}
            />
          </FormGroup>
        </FlexItem>
        <FlexItem>
          <CheTooltip content="Remove Remote">
            <Button
              data-testid="remove-remote"
              className={styles.removeRemoteButton}
              onClick={() => this.props.onDelete()}
              variant={ButtonVariant.plain}
              icon={<MinusCircleIcon />}
            />
          </CheTooltip>
        </FlexItem>
      </Flex>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  sshKeys: selectSshKeys(state),
});

const connector = connect(mapStateToProps, WorkspacesStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(AdditionalGitRemote);
