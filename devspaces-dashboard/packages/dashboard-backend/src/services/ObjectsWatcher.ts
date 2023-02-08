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

import { api } from '@eclipse-che/common';
import { IWatcherService } from '../devworkspaceClient';
import { NotificationMessage, Observer, SubjectWatcher } from './types/Observer';

/**
 * This class implements the Observer pattern. It allows to manage subscribers and notify them.
 */
export class ObjectsWatcher implements SubjectWatcher {
  private observer: Observer | undefined;
  private readonly ApiService: IWatcherService;
  private readonly channel: api.webSocket.Channel;

  constructor(apiService: IWatcherService, channel: api.webSocket.Channel) {
    this.ApiService = apiService;
    this.channel = channel;
  }

  attach(observer: Observer): void {
    this.observer = observer;
  }

  detach(): void {
    this.observer = undefined;
  }

  notify(message: NotificationMessage): void {
    this.observer?.update(this.channel, message);
  }

  async start(namespace: string, resourceVersion: string): Promise<void> {
    const listener = (message: NotificationMessage) => this.notify(message);

    await this.ApiService.watchInNamespace(namespace, resourceVersion, listener);
  }

  stop(): void {
    this.ApiService.stopWatching();
  }
}
