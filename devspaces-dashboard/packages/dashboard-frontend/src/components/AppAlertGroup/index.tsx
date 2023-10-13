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

import { Alert, AlertActionCloseButton, AlertGroup, AlertVariant } from '@patternfly/react-core';
import React from 'react';

import { lazyInject } from '@/inversify.config';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { AlertItem } from '@/services/helpers/types';

type Props = unknown;

type State = {
  alerts: AlertItem[];
};

class AppAlertGroup extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  private readonly showAlertHandler: (alerts: AlertItem[]) => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      alerts: [],
    };
    this.showAlertHandler = (alerts: AlertItem[]) => {
      this.setState({ alerts });
    };
  }

  public componentDidMount(): void {
    this.appAlerts.subscribe(this.showAlertHandler);
  }

  public componentWillUnmount(): void {
    this.appAlerts.unsubscribe(this.showAlertHandler);
  }

  private getTime(variant: AlertVariant, timeout?: boolean | number): boolean | number {
    if (timeout !== undefined) {
      return timeout;
    }

    let time: number;

    switch (variant) {
      case AlertVariant.success:
        time = 2000;
        break;
      case AlertVariant.info:
        time = 8000;
        break;
      default:
        time = 20000;
    }

    return time;
  }

  private getAlert(item: AlertItem): React.ReactElement {
    const { variant, title, key, children, timeout } = item;
    return (
      <Alert
        variant={variant}
        title={title}
        key={key}
        timeout={this.getTime(variant, timeout)}
        onTimeout={() => this.appAlerts.removeAlert(key)}
        actionClose={
          <AlertActionCloseButton
            onClose={() => {
              this.appAlerts.removeAlert(key);
            }}
          />
        }
      >
        {children ? children : ''}
      </Alert>
    );
  }

  public render(): React.ReactElement {
    return <AlertGroup isToast>{this.state.alerts.map(alert => this.getAlert(alert))}</AlertGroup>;
  }
}

export default AppAlertGroup;
