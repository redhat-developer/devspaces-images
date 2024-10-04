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
  AlertVariant,
  Button,
  ButtonVariant,
  Checkbox,
  Modal,
  ModalVariant,
  Text,
  TextContent,
} from '@patternfly/react-core';
import { inject } from 'inversify';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { AppAlerts } from '@/services/alerts/appAlerts';
import { AppState } from '@/store';
import { selectIsAllowedSourcesConfigured } from '@/store/ServerConfig/selectors';
import { workspacePreferencesActionCreators } from '@/store/Workspaces/Preferences';
import { isTrustedRepo } from '@/store/Workspaces/Preferences/helpers';
import { selectPreferencesTrustedSources } from '@/store/Workspaces/Preferences/selectors';

export type Props = MappedProps & {
  location: string;
  isOpen: boolean;
  onClose?: () => void;
  onContinue: () => void;
};
export type State = {
  // true if `onContinue` can be called
  canContinue: boolean;
  continueButtonDisabled: boolean;
  isTrusted: boolean;
  isAllowedSourcesConfigured: boolean;
  trustAllCheckbox: boolean;
};

class UntrustedSourceModal extends React.Component<Props, State> {
  @inject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    this.state = {
      canContinue: true,
      continueButtonDisabled: false,
      isTrusted: isTrustedRepo(props.trustedSources, props.location),
      isAllowedSourcesConfigured: this.props.isAllowedSourcesConfigured,
      trustAllCheckbox: false,
    };
  }

  public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
    const isTrusted = isTrustedRepo(this.props.trustedSources, this.props.location);
    const nextIsTrusted = isTrustedRepo(nextProps.trustedSources, nextProps.location);
    if (isTrusted !== nextIsTrusted) {
      return true;
    }

    if (this.state.continueButtonDisabled !== nextState.continueButtonDisabled) {
      return true;
    }

    if (this.props.isOpen !== nextProps.isOpen) {
      return true;
    }

    if (this.props.location !== nextProps.location) {
      return true;
    }

    if (this.state.trustAllCheckbox !== nextState.trustAllCheckbox) {
      return true;
    }

    if (this.state.isAllowedSourcesConfigured !== nextState.isAllowedSourcesConfigured) {
      return true;
    }

    return false;
  }

  public componentDidMount(): void {
    if (this.props.isOpen && (this.state.isTrusted || this.state.isAllowedSourcesConfigured)) {
      this.handleContinue();
    }
  }

  public componentDidUpdate(prevProps: Readonly<Props>): void {
    const isTrusted = isTrustedRepo(this.props.trustedSources, this.props.location);
    const isAllowedSourcesConfigured = this.props.isAllowedSourcesConfigured;

    this.setState({
      isTrusted,
      isAllowedSourcesConfigured,
    });

    if (
      prevProps.isOpen === false &&
      this.props.isOpen === true &&
      (isTrusted === true || isAllowedSourcesConfigured) &&
      this.state.canContinue === true
    ) {
      this.handleContinue();
    }
  }

  private handleTrustAllToggle(checked: boolean): void {
    this.setState({ trustAllCheckbox: checked });
  }

  private handleClose(): void {
    this.setState({
      canContinue: true,
      continueButtonDisabled: false,
      trustAllCheckbox: false,
    });

    this.props.onClose?.();
  }

  private async handleContinue(updateSource = false): Promise<void> {
    try {
      this.setState({
        canContinue: false,
        continueButtonDisabled: true,
      });

      if (updateSource) {
        await this.updateTrustedSources();
      }

      this.props.onContinue();
    } catch (e) {
      this.appAlerts.showAlert({
        key: 'update-trusted-sources',
        title: 'Failed to update trusted sources',
        variant: AlertVariant.danger,
      });
    }

    this.handleClose();
  }

  private async updateTrustedSources(): Promise<void> {
    const { location, trustedSources } = this.props;
    const { trustAllCheckbox } = this.state;

    if (trustedSources === '*') {
      return;
    } else if (trustAllCheckbox) {
      await this.props.addTrustedSource('*');
    } else {
      await this.props.addTrustedSource(location);
    }
  }

  private buildModalFooter(): React.ReactNode {
    const { continueButtonDisabled } = this.state;

    return (
      <React.Fragment>
        <Button
          key="continue"
          variant={ButtonVariant.primary}
          onClick={() => this.handleContinue(true)}
          isDisabled={continueButtonDisabled}
        >
          Continue
        </Button>
        <Button key="cancel" variant={ButtonVariant.link} onClick={() => this.handleClose()}>
          Cancel
        </Button>
      </React.Fragment>
    );
  }

  private buildModalBody(): React.ReactNode {
    const { trustAllCheckbox: isChecked } = this.state;
    return (
      <TextContent>
        <Text>
          Click <b>Continue</b> to proceed creating a new workspace from this source.
        </Text>
        <Checkbox
          id="trust-all-repos-checkbox"
          isChecked={isChecked}
          label="Do not ask me again for other repositories"
          onChange={(checked: boolean) => {
            this.handleTrustAllToggle(checked);
          }}
        />
      </TextContent>
    );
  }

  render(): React.ReactNode {
    const { isOpen } = this.props;
    const { isTrusted } = this.state;

    if (isTrusted) {
      return null;
    }

    const title = 'Do you trust the authors of this repository?';
    const footer = this.buildModalFooter();
    const body = this.buildModalBody();

    return (
      <Modal
        footer={footer}
        isOpen={isOpen}
        title={title}
        titleIconVariant="warning"
        variant={ModalVariant.medium}
        onClose={() => this.handleClose()}
      >
        {body}
      </Modal>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  trustedSources: selectPreferencesTrustedSources(state),
  isAllowedSourcesConfigured: selectIsAllowedSourcesConfigured(state),
});

const connector = connect(mapStateToProps, workspacePreferencesActionCreators, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});

type MappedProps = ConnectedProps<typeof connector>;
export default connector(UntrustedSourceModal);
