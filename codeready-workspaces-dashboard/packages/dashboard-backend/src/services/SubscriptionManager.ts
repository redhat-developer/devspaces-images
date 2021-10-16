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

import DevWorkspaceWatcher from './DevWorkspaceWatcher';
import { IDevWorkspaceCallbacks } from '../devworkspace-client';
import WebSocket from 'ws';
import { V1alpha2DevWorkspace } from '@devfile/api';

class SubscriptionManager {
  private readonly subscriber: WebSocket;
  private readonly channels: string[];
  private readonly callbacks: IDevWorkspaceCallbacks;
  private namespaceData: DevWorkspaceWatcher | undefined;

  constructor(subscriber: WebSocket) {
    this.subscriber = subscriber;
    this.channels = [];
    this.callbacks = {
      onModified: (workspace: V1alpha2DevWorkspace) => {
        this.publish('onModified', workspace);
      },
      onDeleted: (workspaceId: string) => {
        this.publish('onDeleted', workspaceId);
      },
      onAdded: (workspace: V1alpha2DevWorkspace) => {
        this.publish('onAdded', workspace);
      },
      onError: (error: string) => {
        this.channels.length = 0;
        this.namespaceData = undefined;
        // code 1011: Internal Error
        this.subscriber.close(1011, error);
      }
    };
  }

  unsubscribe(channel: string): void {
    const index = this.channels.indexOf(channel);
    if (index !== -1) {
      this.channels.splice(index, 1);
    }
    if (this.channels.length === 0) {
      this.namespaceData = undefined;
    }
  }

  subscribe(channel: string, data: { token: string, namespace: string, resourceVersion: string }): void {
    if (this.channels.indexOf(channel) === -1) {
      this.channels.push(channel);
    }
    if (this.namespaceData) {
      if (this.namespaceData.getNamespace() === data.namespace) {
        this.namespaceData.setParams(data.token, data.resourceVersion);
      }
    } else {
      this.namespaceData = new DevWorkspaceWatcher({
        callbacks: this.callbacks,
        token: data.token,
        namespace: data.namespace,
        resourceVersion: data.resourceVersion,
      });
      this.namespaceData.subscribe();
    }
  }

  publish(channel: string, message: any): void {
    if (this.channels.indexOf(channel) !== -1) {
      this.subscriber.send(JSON.stringify({ message, channel }));
    }
  }

}

export default SubscriptionManager;
