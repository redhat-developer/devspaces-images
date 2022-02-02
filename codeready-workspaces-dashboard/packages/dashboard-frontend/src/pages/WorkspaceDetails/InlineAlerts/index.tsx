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
  AlertGroup,
  Alert,
  AlertVariant,
  AlertActionCloseButton,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import devfileApi from '../../../services/devfileApi';
import { DevWorkspaceStatus } from '../../../services/helpers/types';
import { Workspace } from '../../../services/workspace-adapter';

const migratingDocs =
  'https://devfile.io/docs/devfile/2.1.0/user-guide/migrating-to-devfile-v2.html';

type Props = {
  workspace: Workspace;
  conversionError: string | undefined;
  onCloseConversionAlert: () => void;
  showRestartWarning: boolean;
  onCloseRestartAlert: () => void;
};

type State = {
  showFailureAlert: boolean;
};

export class WorkspaceInlineAlerts extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      showFailureAlert: true,
    };
  }

  private buildDeprecationAlert(): React.ReactElement {
    return (
      <Alert
        variant={AlertVariant.warning}
        isInline
        title="This workspace is deprecated. Please refer the document below to see next steps."
      >
        <a href={migratingDocs} rel="noreferrer" target="_blank">
          Migrating to devfile v2
        </a>
      </Alert>
    );
  }

  private buildConversionAlert(): React.ReactElement {
    const { conversionError } = this.props;
    return (
      <Alert
        variant={AlertVariant.danger}
        isInline
        title="Workspace conversion failed."
        actionClose={<AlertActionCloseButton onClose={() => this.props.onCloseConversionAlert()} />}
      >
        <TextContent>
          {conversionError}
          <Text component={TextVariants.small}>
            Find manual instructions for converting devfile v1 to devfile v2 in the{' '}
            <a href={migratingDocs} rel="noreferrer" target="_blank">
              documentation
            </a>
            .
          </Text>
        </TextContent>
      </Alert>
    );
  }

  private buildRestartAlert(): React.ReactElement {
    const { workspace } = this.props;
    return (
      <Alert
        variant={AlertVariant.warning}
        isInline
        title={
          <React.Fragment>
            The workspace <em>{workspace.name}&nbsp;</em> should be restarted to apply changes.
          </React.Fragment>
        }
        actionClose={<AlertActionCloseButton onClose={() => this.props.onCloseRestartAlert()} />}
      />
    );
  }

  private buildFailureAlert(): React.ReactElement {
    const { workspace } = this.props;
    if (!workspace.isDevWorkspace) {
      return <></>;
    }
    const { status } = workspace.ref as devfileApi.DevWorkspace;
    if (!status) {
      return <></>;
    }
    const title = status.message;
    if (!title) {
      return <></>;
    }

    return (
      <Alert
        variant={AlertVariant.danger}
        isInline
        title={title}
        actionClose={<AlertActionCloseButton onClose={() => this.handleCloseFailureAlert()} />}
      />
    );
  }

  private handleCloseFailureAlert(): void {
    this.setState({
      showFailureAlert: false,
    });
  }

  public componentDidUpdate(prevProps: Props): void {
    if (this.state.showFailureAlert === false) {
      const showFailureAlert = this.props.workspace.status !== prevProps.workspace.status;
      this.setState({
        showFailureAlert,
      });
    }
  }

  render(): React.ReactElement {
    const { workspace, conversionError, showRestartWarning: restartWarning } = this.props;
    const { showFailureAlert } = this.state;

    return (
      <AlertGroup className={spacing.mbLg}>
        {workspace.isDeprecated && this.buildDeprecationAlert()}
        {conversionError && this.buildConversionAlert()}
        {restartWarning && this.buildRestartAlert()}
        {showFailureAlert &&
          workspace.status === DevWorkspaceStatus.FAILED &&
          this.buildFailureAlert()}
      </AlertGroup>
    );
  }
}
