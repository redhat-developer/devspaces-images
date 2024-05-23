/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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

@injectable()
export class TabManager {
  private tabs: { [url: string]: WindowProxy } = {};

  private getTab(url: string): WindowProxy | undefined {
    return this.tabs[url];
  }

  private removeClosedTab(url: string): void {
    const tab = this.getTab(url);
    if (tab && tab.closed) {
      delete this.tabs[url];
    }
  }

  private focusTab(url: string): boolean {
    const tab = this.getTab(url);
    if (this.isSameOrigin(url) && tab && !tab.closed) {
      tab.focus();
      return true;
    }
    return false;
  }

  private openNewTab(url: string): boolean {
    const newTab = window.open(url, url);
    if (newTab === null) {
      return false;
    }
    if (this.isSameOrigin(url)) {
      this.tabs[url] = newTab;
    }
    return true;
  }

  private isSameOrigin(_url: string): boolean {
    try {
      const url = new URL(_url);
      return url.origin === window.location.origin;
    } catch (e) {
      // not a valid URL
      return false;
    }
  }

  public open(url: string): void {
    this.removeClosedTab(url);
    if (this.focusTab(url)) {
      return;
    }

    const success = this.openNewTab(url);
    if (success === false) {
      // browser fails to open the tab
      // redirect to the URL
      window.location.replace(url);
    }
  }

  // replace the current window with the new URL
  public replace(url: string): void {
    window.location.replace(url);
  }

  // set the current window browser context
  public rename(url: string): void {
    window.name = url;
  }
}
