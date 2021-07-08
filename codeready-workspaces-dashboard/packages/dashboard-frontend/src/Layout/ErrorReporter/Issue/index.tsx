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
import { WarningTriangleIcon } from '@patternfly/react-icons';
import React from 'react';
import { BrandingData } from '../../../services/bootstrap/branding.constant';
import { Issue } from '../../../services/bootstrap/issuesReporter';

import * as styles from './index.module.css';

type Props = {
  branding: BrandingData;
  issue: Issue;
}

export class IssueComponent extends React.PureComponent<Props> {

  public render(): React.ReactNode {
    const { issue } = this.props;

    switch (issue.type) {
      case 'cert':
        return this.renderCertError();
      case 'sso':
        return this.renderSsoError(issue.error);
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
          Your {productName} server may be using a self-signed certificate. To resolve this issue, try to import the servers CA certificate into your browser, as described <a href={certDocumentation} target="_blank" rel="noreferrer">here</a>.
        </Text>
        <Text component={TextVariants.p}>After importing the certificate, refresh your browser.</Text>
        <Text component={TextVariants.p}><a href="/">Refresh Now</a></Text>
      </TextContent>
    );
  }

  private renderSsoError(error: Error): React.ReactNode {

    const messageTextbox = (<Text component={TextVariants.p}>
      We are experiencing some technical difficulties from our SSO{error ? ':' : '.'}
    </Text>);
    const errorTextbox = !error
      ? undefined
      : (<Text component={TextVariants.pre} className={styles.errorMessage}>{error.message}</Text>);

    return (
      <TextContent>
        <Text component={TextVariants.h1}>
          <WarningTriangleIcon className={styles.warningIcon} />
          SSO Error
        </Text>
        {messageTextbox}
        {errorTextbox}
        <Text component={TextVariants.p}>
          Please try <kbd className={styles.keybinding}>Shift</kbd>+<kbd className={styles.keybinding}>Refresh</kbd>
        </Text>
      </TextContent>
    );
  }

  private renderUnknownError(error: Error): React.ReactNode {
    const errorTextbox = !error
      ? undefined
      : (<Text component={TextVariants.pre} className={styles.errorMessage}>{error.message}</Text>);

    return (
      <TextContent>
        <Text component={TextVariants.h1}>
          <WarningTriangleIcon className={styles.warningIcon} />
          Error
        </Text>
        {errorTextbox}
        <Text component={TextVariants.p}>
          Please try <kbd>Shift</kbd>+<kbd>Refresh</kbd>
        </Text>
      </TextContent>
    );
  }

}
