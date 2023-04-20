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

/**
 * The Subject interface declares a set of methods for attaching/detaching the observer, and notifying the observer about events.
 */
export interface Subject {
  // Attach an observer to the subject.
  attach(observer: Observer): void;

  // Detach an observer from the subject.
  detach(): void;

  // Notify all observers about an event.
  notify(...args: unknown[]): void;
}

/**
 * This interface adds methods for starting/stopping watching changes of the subject.
 */
export interface SubjectWatcher<T> extends Subject {
  start(namespace: string, params: T): Promise<void>;
  stop(): void;
}

/**
 * The Observer interface declares the update method, used by subjects.
 */
export interface Observer {
  // Receive update from subject.
  update(channel: api.webSocket.Channel, message: NotificationMessage): void;
}

export type NotificationMessage = api.webSocket.NotificationMessage;
export type MessageListener = (message: NotificationMessage) => void;
