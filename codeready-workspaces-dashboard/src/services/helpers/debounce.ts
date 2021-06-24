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

import { injectable } from 'inversify';

/**
 * This class is handling the debounce delay service.
 * @author Oleksii Orel
 */
@injectable()
export class Debounce {
  private debounceTimer: any;
  private isDebounceDelay = false;
  private debounceDelayHandlers: Array<Function> = [];

  setDelay(timeDelay = 5000): void {
    this.setDebounceDelay(true);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.setDebounceDelay(false);
    }, timeDelay);
  }

  private setDebounceDelay(isDebounceDelay: boolean): void {
    this.isDebounceDelay = isDebounceDelay;
    this.debounceDelayHandlers.forEach(handler => {
      if (typeof handler === 'function') {
        handler(isDebounceDelay);
      }
    });
  }

  /**
   * Subscribe on the debounce delay event.
   * @param handler
   */
  subscribe(handler: (isDebounceDelay: boolean) => void): void {
    this.debounceDelayHandlers.push(handler);
  }

  /**
   * Unsubscribe on the show alert event.
   * @param handler
   */
  public unsubscribe(handler: (isDebounceDelay: boolean) => void): void {
    const index = this.debounceDelayHandlers.indexOf(handler);
    if (index !== -1) {
      this.debounceDelayHandlers.splice(index, 1);
    }
  }

  /**
   * Unsubscribe all.
   */
  unsubscribeAll(): void {
    this.debounceDelayHandlers = [];
  }

  hasDelay(): boolean {
    return this.isDebounceDelay;
  }
}
