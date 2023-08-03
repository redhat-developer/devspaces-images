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

type DebounceEventHandler = () => void;

/**
 * This class is handling debounce time service
 * @author Oleksii Orel
 */
export class Debounce {
  private delayTimer: number | undefined;
  private handlers: DebounceEventHandler[] = [];

  private onExecute(): void {
    this.handlers.forEach(handler => {
      handler();
    });
  }

  /**
   * Execute all handlers depends on dueTime
   * @param dueTime
   */
  execute(dueTime = 500): void {
    if (this.delayTimer) {
      window.clearTimeout(this.delayTimer);
    }
    this.delayTimer = window.setTimeout(() => {
      this.delayTimer = undefined;
      this.onExecute();
    }, dueTime);
  }

  /**
   * Subscribe on the debounce execute event
   * @param handler
   */
  subscribe(handler: DebounceEventHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index === -1) {
      this.handlers.push(handler);
    }
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
    if (this.handlers.length === 0 && this.delayTimer) {
      window.clearTimeout(this.delayTimer);
    }
  }
}
