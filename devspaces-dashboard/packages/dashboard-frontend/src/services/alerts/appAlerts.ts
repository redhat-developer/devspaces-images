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

import 'reflect-metadata';

import { injectable } from 'inversify';

import { AlertItem } from '@/services/helpers/types';

type Handler = (alerts: AlertItem[]) => void;

/**
 * This class is handling the app alerts service.
 * @author Oleksii Orel
 */
@injectable()
export class AppAlerts {
  private showAlertHandlers: Array<Handler> = [];
  private alerts: AlertItem[] = [];

  private onChange(): void {
    this.showAlertHandlers.forEach(handler => {
      handler([...this.alerts]);
    });
  }

  public removeAlert(key: string): void {
    this.alerts = this.alerts.filter(al => al.key !== key);
    this.onChange();
  }

  public showAlert(alert: AlertItem): void {
    this.removeAlert(alert.key);
    this.alerts.push(alert);
    this.onChange();
  }

  /**
   * Subscribe on the show alert event.
   * @param handler
   */
  public subscribe(handler: Handler): void {
    this.showAlertHandlers.push(handler);
  }

  /**
   * Unsubscribe on the show alert event.
   * @param handler
   */
  public unsubscribe(handler: Handler): void {
    const index = this.showAlertHandlers.indexOf(handler);
    if (index !== -1) {
      this.showAlertHandlers.splice(index, 1);
    }
  }

  /**
   * Unsubscribe all.
   */
  public unsubscribeAll(): void {
    this.showAlertHandlers = [];
  }
}
