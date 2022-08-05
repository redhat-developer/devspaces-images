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

import { TextContent, Text, TextVariants } from '@patternfly/react-core';
import { InfoIcon, WarningTriangleIcon } from '@patternfly/react-icons';
import React from 'react';
import { BrandingData } from '../../../services/bootstrap/branding.constant';
import { Issue, WorkspaceRoutes } from '../../../services/bootstrap/issuesReporter';

import styles from './index.module.css';

type Props = {
  branding: BrandingData;
  issue: Issue;
};

export class IssueComponent extends React.PureComponent<Props> {
  public render(): React.ReactNode {
    const { issue } = this.props;

    switch (issue.type) {
      case 'cert':
        return this.renderCertError();
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

  private renderCertError(): React.ReactNode {
    const productName = this.props.branding.name;
    const certDocumentation = this.props.branding.docs.certificate;
    return (
      <TextContent className={styles.messageContainer}>
        <Text component={TextVariants.h1}>
          <WarningTriangleIcon className={styles.warningIcon} />
          Certificate Error
        </Text>
        <Text component={TextVariants.p}>
          Your {productName} server may be using a self-signed certificate. To resolve this issue,
          try to import the servers CA certificate into your browser, as described{' '}
          <a href={certDocumentation} target="_blank" rel="noreferrer">
            here
          </a>
          .
        </Text>
        <Text component={TextVariants.p}>
          After importing the certificate, refresh your browser.
        </Text>
        <Text component={TextVariants.p}>
          <a href="/">Refresh Now</a>
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

  private renderInactivityTimeoutError(
    workspaceRoutes: WorkspaceRoutes | undefined,
  ): React.ReactNode {
    let ideLoader: React.ReactNode;
    let workspaceDetails: React.ReactNode;

    if (workspaceRoutes) {
      ideLoader = this.renderLinkWithHash(workspaceRoutes.ideLoader, 'Restart your workspace');
      workspaceDetails = (
        <Text component={TextVariants.p}>
          {this.renderLinkWithHash(workspaceRoutes.workspaceDetails, 'Return to dashboard')}
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
          Your workspace has stopped due to inactivity. {ideLoader} to continue using your
          workspace.
        </Text>
        {workspaceDetails}
      </TextContent>
    );
  }

  private renderRunTimeoutError(workspaceRoutes: WorkspaceRoutes | undefined): React.ReactNode {
    let ideLoader: React.ReactNode;
    let workspaceDetails: React.ReactNode;

    if (workspaceRoutes) {
      ideLoader = this.renderLinkWithHash(workspaceRoutes.ideLoader, 'Restart your workspace');
      workspaceDetails = (
        <Text component={TextVariants.p}>
          {this.renderLinkWithHash(workspaceRoutes.workspaceDetails, 'Return to dashboard')}
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
          Your workspace has stopped because it has reached the run timeout. {ideLoader} to continue
          using your workspace.
        </Text>
        {workspaceDetails}
      </TextContent>
    );
  }

  private renderWorkspaceStoppedWithError(
    error: Error,
    workspaceRoutes: WorkspaceRoutes | undefined,
  ) {
    let ideLoader: React.ReactNode;
    let workspaceDetails: React.ReactNode;

    if (workspaceRoutes) {
      ideLoader = (
        <Text component={TextVariants.p}>
          {this.renderLinkWithHash(workspaceRoutes.ideLoader, 'Restart your workspace')}
        </Text>
      );

      workspaceDetails = (
        <Text component={TextVariants.p}>
          {this.renderLinkWithHash(workspaceRoutes.workspaceDetails, 'Return to dashboard')}
        </Text>
      );
    }

    const messageTextbox = (
      <Text component={TextVariants.p}>
        Your workspace has failed with {!error ? 'an error' : 'the following error:'}
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
          Warning
        </Text>
        {messageTextbox}
        {errorTextbox}
        {ideLoader}
        {workspaceDetails}
      </TextContent>
    );
  }

  private renderWorkspaceStopped(workspaceRoutes: WorkspaceRoutes | undefined) {
    let ideLoader: React.ReactNode;
    let workspaceDetails: React.ReactNode;

    if (workspaceRoutes) {
      ideLoader = this.renderLinkWithHash(workspaceRoutes.ideLoader, 'Start your workspace');
      workspaceDetails = (
        <Text component={TextVariants.p}>
          {this.renderLinkWithHash(workspaceRoutes.workspaceDetails, 'Return to dashboard')}
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
}
