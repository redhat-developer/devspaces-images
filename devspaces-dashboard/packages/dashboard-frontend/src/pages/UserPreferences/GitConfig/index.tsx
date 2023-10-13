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

import { helpers } from '@eclipse-che/common';
import { AlertVariant, PageSection } from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import ProgressIndicator from '@/components/Progress';
import { lazyInject } from '@/inversify.config';
import { GitConfigEmptyState } from '@/pages/UserPreferences/GitConfig/EmptyState';
import { GitConfigSectionUser } from '@/pages/UserPreferences/GitConfig/SectionUser';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { AppState } from '@/store';
import * as GitConfigStore from '@/store/GitConfig';
import {
  selectGitConfigError,
  selectGitConfigIsLoading,
  selectGitConfigUser,
} from '@/store/GitConfig/selectors';

export type Props = MappedProps;

class GitConfig extends React.PureComponent<Props> {
  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  public async componentDidMount(): Promise<void> {
    const { gitConfigIsLoading, requestGitConfig } = this.props;

    if (gitConfigIsLoading === true) {
      return;
    }

    try {
      await requestGitConfig();
    } catch (error) {
      console.error(error);
    }
  }

  public componentDidUpdate(prevProps: Props): void {
    const { gitConfigError } = this.props;
    if (gitConfigError && gitConfigError !== prevProps.gitConfigError) {
      this.appAlerts.showAlert({
        key: 'gitconfig-error',
        title: helpers.errors.getMessage(gitConfigError),
        variant: AlertVariant.danger,
      });
    }
  }

  private async handleChangeConfigUser(gitConfigUser: GitConfigStore.GitConfigUser): Promise<void> {
    try {
      await this.props.updateGitConfig(gitConfigUser);
      this.appAlerts.showAlert({
        key: 'gitconfig-success',
        title: 'Gitconfig saved successfully.',
        variant: AlertVariant.success,
      });
    } catch (error) {
      console.error('Failed to update gitconfig', error);
    }
  }

  public render(): React.ReactElement {
    const { gitConfigIsLoading, gitConfigUser } = this.props;

    const isEmpty = gitConfigUser === undefined;

    return (
      <React.Fragment>
        <ProgressIndicator isLoading={gitConfigIsLoading} />
        <PageSection>
          {isEmpty ? (
            <GitConfigEmptyState />
          ) : (
            <GitConfigSectionUser
              config={gitConfigUser}
              onChange={gitConfigUser => this.handleChangeConfigUser(gitConfigUser)}
            />
          )}
        </PageSection>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  gitConfigUser: selectGitConfigUser(state),
  gitConfigIsLoading: selectGitConfigIsLoading(state),
  gitConfigError: selectGitConfigError(state),
});

const connector = connect(mapStateToProps, GitConfigStore.actionCreators, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});

type MappedProps = ConnectedProps<typeof connector>;
export default connector(GitConfig);
