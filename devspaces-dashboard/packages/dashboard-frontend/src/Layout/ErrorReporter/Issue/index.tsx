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

import { TextContent, Text, TextVariants, Button, ButtonVariant } from '@patternfly/react-core';
import { InfoIcon, WarningTriangleIcon } from '@patternfly/react-icons';
import React from 'react';
import { BrandingData } from '../../../services/bootstrap/branding.constant';
import { Issue, WorkspaceData } from '../../../services/bootstrap/issuesReporter';
import { signIn } from '../../../services/helpers/login';

import styles from './index.module.css';

type Props = {
  branding: BrandingData;
  issue: Issue;
};

export class IssueComponent extends React.PureComponent<Props> {
  public render(): React.ReactNode {
    const { issue } = this.props;

    switch (issue.type) {
      case 'sessionExpired':
        return this.renderSessionExpired(issue.error);
      case 'sso':
        return this.renderSsoError(issue.error);
      case 'workspaceInactive':
        return this.renderInactivityTimeoutError(issue.data);
      case 'workspaceRunTimeout':
        return this.renderRunTimeoutError(issue.data);
      case 'workspaceStoppedError':
        return this.renderWorkspaceStoppedWithError(issue.error, issue.data);
      case 'workspaceStopped':
        return this.renderWorkspaceStopped(issue.data);
      default:
        return this.renderUnknownError(issue.error);
    }
  }

  private renderSessionExpired(error: Error): React.ReactNode {
    const errorTextbox = !error ? undefined : (
      <Text component={TextVariants.pre} className={styles.errorMessage}>
        {error.message}
      </Text>
    );

    return (
      <TextContent className={styles.messageContainer}>
        <Text component={TextVariants.h1}>
          <WarningTriangleIcon className={styles.warningIcon} />
          Error
        </Text>
        {errorTextbox}
        <Text component={TextVariants.p}>
          <Button onClick={() => signIn()} variant={ButtonVariant.link} isInline>
            Sign in
          </Button>
        </Text>
      </TextContent>
    );
  }

  private renderSsoError(error: Error): React.ReactNode {
    const messageTextbox = (
      <Text component={TextVariants.p}>
        We are experiencing some technical difficulties from our SSO{error ? ':' : '.'}
      </Text>
    );
    const errorTextbox = !error ? undefined : (
      <Text component={TextVariants.pre} className={styles.errorMessage}>
        {error.message}
      </Text>
    );

    return (
      <TextContent className={styles.messageContainer}>
        <Text component={TextVariants.h1}>
          <WarningTriangleIcon className={styles.warningIcon} />
          SSO Error
        </Text>
        {messageTextbox}
        {errorTextbox}
        <Text component={TextVariants.p}>
          Please try <kbd className={styles.keybinding}>Shift</kbd>+
          <kbd className={styles.keybinding}>Refresh</kbd>
        </Text>
      </TextContent>
    );
  }

  private renderLinkWithHash(hash: string, text: string): React.ReactNode {
    return (
      <a
        onClick={() => {
          window.location.hash = hash;
          window.location.reload();
        }}
      >
        {text}
      </a>
    );
  }

  private renderInactivityTimeoutError(workspaceData: WorkspaceData | undefined): React.ReactNode {
    let ideLoader: React.ReactNode;
    let workspaceDetails: React.ReactNode;

    let reasonMessage: string;
    if (workspaceData?.timeout && workspaceData.timeout > -1) {
      reasonMessage = `Your workspace has stopped because there was no activity for ${this.renderTimeout(
        workspaceData.timeout,
      )}. `;
    } else {
      reasonMessage = 'Your workspace has stopped due to inactivity. ';
    }

    if (workspaceData) {
      ideLoader = this.renderLinkWithHash(workspaceData.ideLoaderPath, 'Restart your workspace');
      workspaceDetails = (
        <Text component={TextVariants.p}>
          {this.renderLinkWithHash(workspaceData.workspaceDetailsPath, 'Return to dashboard')}
        </Text>
      );
    } else {
      ideLoader = 'Restart your workspace';
    }

    return (
      <TextContent className={styles.messageContainer}>
        <Text component={TextVariants.h1}>
          <WarningTriangleIcon className={styles.warningIcon} />
          Warning
        </Text>
        <Text component={TextVariants.p}>
          {reasonMessage}
          {ideLoader} to continue using your workspace.
        </Text>
        {workspaceDetails}
      </TextContent>
    );
  }

  private renderRunTimeoutError(workspaceData: WorkspaceData | undefined): React.ReactNode {
    let ideLoader: React.ReactNode;
    let workspaceDetails: React.ReactNode;

    let reasonMessage: string;
    if (workspaceData?.timeout && workspaceData.timeout > -1) {
      reasonMessage = `Your workspace has stopped because it has reached the maximum run time of ${this.renderTimeout(
        workspaceData.timeout,
      )}. `;
    } else {
      reasonMessage = 'Your workspace has stopped because it has reached the maximum run time. ';
    }

    if (workspaceData) {
      ideLoader = this.renderLinkWithHash(workspaceData.ideLoaderPath, 'Restart your workspace');
      workspaceDetails = (
        <Text component={TextVariants.p}>
          {this.renderLinkWithHash(workspaceData.workspaceDetailsPath, 'Return to dashboard')}
        </Text>
      );
    } else {
      ideLoader = 'Restart your workspace';
    }

    return (
      <TextContent className={styles.messageContainer}>
        <Text component={TextVariants.h1}>
          <WarningTriangleIcon className={styles.warningIcon} />
          Warning
        </Text>
        <Text component={TextVariants.p}>
          {reasonMessage}
          {ideLoader} to continue using your workspace.
        </Text>
        {workspaceDetails}
      </TextContent>
    );
  }

  private renderWorkspaceStoppedWithError(error: Error, workspaceData: WorkspaceData | undefined) {
    let ideLoader: React.ReactNode;
    let workspaceDetails: React.ReactNode;

    if (workspaceData) {
      ideLoader = (
        <Text component={TextVariants.p}>
          {this.renderLinkWithHash(workspaceData.ideLoaderPath, 'Restart your workspace')}
        </Text>
      );

      workspaceDetails = (
        <Text component={TextVariants.p}>
          {this.renderLinkWithHash(workspaceData.workspaceDetailsPath, 'Return to dashboard')}
        </Text>
      );
    }

    const errorTextbox = !error ? undefined : (
      <Text component={TextVariants.pre} className={styles.errorMessage}>
        {error.message}
      </Text>
    );

    return (
      <TextContent className={styles.messageContainer}>
        <Text component={TextVariants.h1}>
          <WarningTriangleIcon className={styles.warningIcon} />
          Workspace failed
        </Text>
        {errorTextbox}
        {ideLoader}
        {workspaceDetails}
      </TextContent>
    );
  }

  private renderWorkspaceStopped(workspaceData: WorkspaceData | undefined) {
    let ideLoader: React.ReactNode;
    let workspaceDetails: React.ReactNode;

    if (workspaceData) {
      ideLoader = this.renderLinkWithHash(workspaceData.ideLoaderPath, 'Start your workspace');
      workspaceDetails = (
        <Text component={TextVariants.p}>
          {this.renderLinkWithHash(workspaceData.workspaceDetailsPath, 'Return to dashboard')}
        </Text>
      );
    } else {
      ideLoader = 'Start your workspace';
    }

    return (
      <TextContent className={styles.messageContainer}>
        <Text component={TextVariants.h1}>
          <InfoIcon className={styles.infoIcon} />
          Info
        </Text>
        <Text component={TextVariants.p}>
          Your workspace is not running. {ideLoader} to continue using your workspace.
        </Text>
        {workspaceDetails}
      </TextContent>
    );
  }

  private renderUnknownError(error: Error): React.ReactNode {
    const errorTextbox = !error ? undefined : (
      <Text component={TextVariants.pre} className={styles.errorMessage}>
        {error.message}
      </Text>
    );

    return (
      <TextContent className={styles.messageContainer}>
        <Text component={TextVariants.h1}>
          <WarningTriangleIcon className={styles.warningIcon} />
          Error
        </Text>
        {errorTextbox}
        <Text component={TextVariants.p}>
          Please try <kbd className={styles.keybinding}>Shift</kbd>+
          <kbd className={styles.keybinding}>Refresh</kbd>
        </Text>
      </TextContent>
    );
  }

  private renderTimeout(timeout: number) {
    const seconds = timeout % 60;
    const minutes = (timeout - seconds) / 60;
    if (minutes === 0) {
      return `${seconds} seconds`;
    }
    if (seconds === 0) {
      return `${minutes} minutes`;
    }
    return `${minutes} minutes and ${seconds} seconds`;
  }
}
