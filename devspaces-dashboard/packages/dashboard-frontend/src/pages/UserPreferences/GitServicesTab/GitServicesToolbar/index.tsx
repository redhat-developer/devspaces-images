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

import {
  AlertVariant,
  Button,
  ButtonVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { lazyInject } from '../../../../inversify.config';
import { AppAlerts } from '../../../../services/alerts/appAlerts';
import { AlertItem } from '../../../../services/helpers/types';
import RevokeGitServicesModal from '../Modals/RevokeGitServicesModal';
import { api, helpers } from '@eclipse-che/common';
import * as GitOauthConfig from '../../../../store/GitOauthConfig';
import { isEqual } from 'lodash';
import { AppState } from '../../../../store';
import { selectGitOauth } from '../../../../store/GitOauthConfig/selectors';

type Props = MappedProps & {
  callbacks: {
    onChangeSelection?: (selectedItems: api.GitOauthProvider[]) => void;
  };
  selectedItems: api.GitOauthProvider[];
};

type State = {
  currentGitOauth: api.GitOauthProvider | undefined;
  currentGitOauthIndex: number;
  isRevokeModalOpen: boolean;
};

export class GitServicesToolbar extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    this.state = {
      currentGitOauth: undefined,
      currentGitOauthIndex: -1,
      isRevokeModalOpen: false,
    };
  }

  private onChangeSelection(selectedItems: api.GitOauthProvider[]): void {
    if (this.props.callbacks?.onChangeSelection) {
      this.props.callbacks.onChangeSelection(selectedItems);
    }
  }

  public componentDidUpdate(prevProps: Props, prevState: State): void {
    const gitOauth = this.props.gitOauth;
    if (!isEqual(prevProps.gitOauth, gitOauth)) {
      const selectedItems: api.GitOauthProvider[] = [];
      this.props.selectedItems.forEach(selectedItem => {
        if (gitOauth.find(val => val.name === selectedItem) !== undefined) {
          selectedItems.push(selectedItem);
        }
      });
      this.onChangeSelection(selectedItems);
    }
    if (prevState.currentGitOauthIndex !== this.state.currentGitOauthIndex) {
      const currentGitOauth = gitOauth[this.state.currentGitOauthIndex]?.name;
      this.setState({ currentGitOauth });
    }
  }

  private showAlert(alert: AlertItem): void {
    this.appAlerts.showAlert(alert);
  }

  public showOnRevokeGitOauthModal(rowIndex: number): void {
    this.setState({ currentGitOauthIndex: rowIndex, isRevokeModalOpen: true });
  }

  private async revokeOauth(gitOauth: api.GitOauthProvider): Promise<void> {
    try {
      await this.props.revokeOauth(gitOauth);
      this.showAlert({
        key: 'revoke-github',
        variant: AlertVariant.success,
        title: `Git oauth '${gitOauth}' successfully deleted.`,
      });
    } catch (e) {
      this.showAlert({
        key: 'revoke-fail',
        variant: AlertVariant.danger,
        title: helpers.errors.getMessage(e),
      });
    }
  }

  private async handleRevoke(gitOauth?: api.GitOauthProvider): Promise<void> {
    this.setState({ isRevokeModalOpen: false, currentGitOauthIndex: -1 });
    if (gitOauth === undefined) {
      for (const selectedItem of this.props.selectedItems) {
        await this.revokeOauth(selectedItem);
      }
      this.onChangeSelection([]);
    } else {
      await this.revokeOauth(gitOauth);
    }
  }

  private handleModalHide(): void {
    this.setState({ isRevokeModalOpen: false });
  }

  private handleModalShow(): void {
    this.setState({ currentGitOauthIndex: -1, isRevokeModalOpen: true });
  }

  render(): React.ReactNode {
    const { selectedItems } = this.props;
    const { isRevokeModalOpen, currentGitOauth } = this.state;
    return (
      <React.Fragment>
        <RevokeGitServicesModal
          selectedItems={selectedItems}
          onCancel={() => this.handleModalHide()}
          onRevoke={() => this.handleRevoke(currentGitOauth)}
          isOpen={isRevokeModalOpen}
          gitOauth={currentGitOauth}
        />
        <Toolbar id="git-services-list-toolbar" className="pf-m-page-insets">
          <ToolbarContent>
            <ToolbarItem>
              <Button
                variant={ButtonVariant.danger}
                isDisabled={this.props.selectedItems.length === 0}
                data-testid="bulk-revoke-button"
                onClick={() => this.handleModalShow()}
              >
                Revoke
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  gitOauth: selectGitOauth(state),
});

const connector = connect(mapStateToProps, GitOauthConfig.actionCreators, null, {
  forwardRef: true,
});

type MappedProps = ConnectedProps<typeof connector>;
export default connector(GitServicesToolbar);
