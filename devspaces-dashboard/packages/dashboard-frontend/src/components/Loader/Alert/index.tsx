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

import React from 'react';
import { AlertGroup, Alert, AlertActionCloseButton, AlertActionLink } from '@patternfly/react-core';
import { AlertItem } from '../../../services/helpers/types';

import styles from './index.module.css';

export type Props = {
  isToast: boolean;
  alertItem?: AlertItem;
};

export type State = {
  hidden: boolean;
};

export class LoaderAlert extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hidden: this.props.alertItem === undefined,
    };
  }

  private handleOnClose(): void {
    this.setState({
      hidden: true,
    });
  }

  public componentDidUpdate(prevProps: Props): void {
    const { alertItem } = this.props;
    if (alertItem === undefined) {
      return;
    }

    if (alertItem.key && alertItem.key !== prevProps.alertItem?.key) {
      this.setState({
        hidden: false,
      });
    }
  }

  render(): React.ReactElement {
    const { alertItem, isToast } = this.props;
    const { hidden } = this.state;

    if (hidden || alertItem === undefined) {
      return <></>;
    }

    const isInline = !isToast;
    const alertActionLinks = alertItem.actionCallbacks?.map(entry => {
      return (
        <AlertActionLink key={entry.title} onClick={() => entry.callback()}>
          {entry.title}
        </AlertActionLink>
      );
    });
    return (
      <AlertGroup
        data-testid="loader-alerts-group"
        aria-label="Loader Alerts Group"
        isToast={isToast}
      >
        <Alert
          className={styles.fixOverflow}
          data-testid="loader-alert"
          aria-label="Loader Alert"
          isInline={isInline}
          key={alertItem.key}
          title={alertItem.title}
          variant={alertItem.variant}
          actionClose={<AlertActionCloseButton onClose={() => this.handleOnClose()} />}
          actionLinks={<React.Fragment>{alertActionLinks}</React.Fragment>}
        >
          {alertItem.children}
        </Alert>
      </AlertGroup>
    );
  }
}
