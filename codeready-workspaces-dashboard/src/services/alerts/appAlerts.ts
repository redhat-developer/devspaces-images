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

import 'reflect-metadata';
import { injectable } from 'inversify';
import { AlertItem } from '../helpers/types';

/**
 * This class is handling the app alerts service.
 * @author Oleksii Orel
 */
@injectable()
export class AppAlerts {
  private showAlertHandlers: Array<Function> = [];
  private alerts: AlertItem[] = [];

  private onChange(): void {
    this.showAlertHandlers.forEach(handler => {
      if (typeof handler === 'function') {
        handler([...this.alerts]);
      }
    });
  }

  public removeAlert(key: string): void {
    this.alerts = this.alerts.filter(al => al.key !== key);
    this.onChange();
  }

  public showAlert(alert: AlertItem): void {
    this.alerts.push(alert);
    this.onChange();
  }

  /**
   * Subscribe on the show alert event.
   * @param handler
   */
  public subscribe(handler: (alerts: AlertItem[]) => void): void {
    this.showAlertHandlers.push(handler);
  }

  /**
   * Unsubscribe on the show alert event.
   * @param handler
   */
  public unsubscribe(handler: (alerts: AlertItem[]) => void): void {
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
