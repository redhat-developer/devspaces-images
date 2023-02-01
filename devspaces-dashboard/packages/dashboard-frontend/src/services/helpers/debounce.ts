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

import { injectable } from 'inversify';

type DebounceEventHandler = (onStart: boolean) => void;

/**
 * This class is handling debounce time service
 * @author Oleksii Orel
 */
@injectable()
export class Debounce {
  private isWaiting = false;
  private delayTimer: number | undefined;
  private handlers: DebounceEventHandler[] = [];

  private onExecute(isWaiting: boolean): void {
    this.isWaiting = isWaiting;
    this.handlers.forEach(handler => {
      handler(isWaiting);
    });
  }

  /**
   * Execute all handlers depends on dueTime
   * @param dueTime
   */
  execute(dueTime = 5000): void {
    if (this.delayTimer) {
      return;
    }
    this.onExecute(true);
    this.delayTimer = window.setTimeout(() => {
      this.onExecute(false);
      this.delayTimer = undefined;
    }, dueTime);
  }

  /**
   * Subscribe on the debounce execute event
   * @param handler
   */
  subscribe(handler: DebounceEventHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Unsubscribe on the debounce execute event
   * @param handler
   */
  public unsubscribe(handler: DebounceEventHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * Unsubscribe from all execute events
   */
  unsubscribeAll(): void {
    this.handlers = [];
  }
}
