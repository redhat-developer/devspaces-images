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

import { IWatcherService } from '@/devworkspaceClient';
import { NotificationMessage, Observer, SubjectWatcher } from '@/services/types/Observer';

/**
 * This class implements the Observer pattern. It allows to manage subscribers and notify them.
 */
export class ObjectsWatcher<T> implements SubjectWatcher<T> {
  private observer: Observer | undefined;

  constructor(
    private readonly apiService: IWatcherService<T>,
    private readonly channel: api.webSocket.Channel,
  ) {}

  attach(observer: Observer): void {
    this.observer = observer;
  }

  detach(): void {
    this.observer = undefined;
  }

  notify(message: NotificationMessage): void {
    this.observer?.update(this.channel, message);
  }

  async start(namespace: string, params: T): Promise<void> {
    const listener = (message: NotificationMessage) => this.notify(message);

    await this.apiService.watchInNamespace(listener, params);
  }

  stop(): void {
    this.apiService.stopWatching();
  }
}
