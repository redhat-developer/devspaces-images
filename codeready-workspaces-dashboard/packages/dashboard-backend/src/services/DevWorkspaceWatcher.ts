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

import { helpers } from '@eclipse-che/common';
import { IDevWorkspaceCallbacks } from '../devworkspace-client';
import { DwClientProvider } from './kubeclient/dwClientProvider';

class DevWorkspaceWatcher {
  private readonly dwClientProvider: DwClientProvider;
  private readonly callbacks: IDevWorkspaceCallbacks;
  private readonly namespace: string;
  private resourceVersion: string;
  private token: string;
  private unsubscribeFunction: { abort: () => void } | undefined;

  constructor(data: {
    token: string;
    namespace: string;
    resourceVersion: string;
    callbacks: IDevWorkspaceCallbacks;
  }) {
    this.callbacks = data.callbacks;
    this.namespace = data.namespace;
    this.resourceVersion = data.resourceVersion;
    this.token = data.token;
    this.dwClientProvider = new DwClientProvider();
  }

  public getNamespace(): string {
    return this.namespace;
  }

  setParams(token: string, resourceVersion: string): void {
    if (this.token !== token || this.resourceVersion !== resourceVersion) {
      this.token = token;
      this.resourceVersion = resourceVersion;
      this.subscribe();
    }
  }

  async subscribe(): Promise<void> {
    try {
      if (this.unsubscribeFunction) {
        await this.unsubscribe();
      }
      const { devworkspaceApi } = await this.dwClientProvider.getDWClient(this.token);
      this.unsubscribeFunction = await devworkspaceApi.watchInNamespace(
        this.namespace,
        this.resourceVersion,
        this.callbacks,
      );
    } catch (error) {
      this.callbacks.onError('Failed to watch devworkspace: ' + helpers.errors.getMessage(error));
      await this.unsubscribe();
      throw error;
    }
  }

  async unsubscribe(): Promise<void> {
    if (this.unsubscribeFunction?.abort) {
      this.unsubscribeFunction.abort();
      this.unsubscribeFunction = undefined;
      return;
    }
    throw 'Error: There are no subscriptions.';
  }
}

export default DevWorkspaceWatcher;
