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

export enum SessionStorageKey {
  PRIVATE_FACTORY_RELOADS = 'private-factory-reloads-number',
}

export default class SessionStorageService {
  static update(key: SessionStorageKey, value: string): void {
    window.sessionStorage.setItem(key, value);
  }

  static get(key: SessionStorageKey): string | undefined {
    return window.sessionStorage.getItem(key) || undefined;
  }
}
