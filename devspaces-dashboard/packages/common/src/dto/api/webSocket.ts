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

import { V1alpha2DevWorkspace } from '@devfile/api';
import { CoreV1Event, V1Pod, V1Status } from '@kubernetes/client-node';

export enum Channel {
  DEV_WORKSPACE = 'devWorkspace',
  EVENT = 'event',
  POD = 'pod',
}

export function isWebSocketChannel(channel: unknown): channel is Channel {
  return (
    (channel !== undefined &&
      ((channel as Channel) === Channel.DEV_WORKSPACE ||
        (channel as Channel) === Channel.EVENT)) ||
    (channel as Channel) === Channel.POD
  );
}

export type Method = 'SUBSCRIBE' | 'UNSUBSCRIBE';

export function isWebSocketSubscriptionMethod(
  method: unknown,
): method is Method {
  return (
    (method as Method) === 'SUBSCRIBE' || (method as Method) === 'UNSUBSCRIBE'
  );
}

export type SubscribeMessage = {
  method: 'SUBSCRIBE';
  params: SubscribeParams;
  channel: Channel;
};

export type UnsubscribeMessage = {
  method: 'UNSUBSCRIBE';
  params: Record<string, never>;
  channel: Channel;
};

export function isWebSocketSubscriptionMessage(
  message: unknown,
): message is SubscribeMessage | UnsubscribeMessage {
  return (
    message !== undefined &&
    ((isWebSocketSubscriptionMethod((message as SubscribeMessage).method) &&
      (message as SubscribeMessage).method === 'SUBSCRIBE' &&
      isWebSocketSubscribeParams((message as SubscribeMessage).params)) ||
      ((message as UnsubscribeMessage).method === 'UNSUBSCRIBE' &&
        isWebSocketUnsubscribeParams(
          (message as UnsubscribeMessage).params,
        ))) &&
    isWebSocketChannel((message as SubscribeMessage).channel)
  );
}

export type SubscribeParams = {
  namespace: string;
  resourceVersion: string;
};

export function isWebSocketSubscribeParams(
  parameters: unknown,
): parameters is SubscribeParams {
  return (
    parameters !== undefined &&
    (parameters as SubscribeParams).namespace !== undefined &&
    (parameters as SubscribeParams).resourceVersion !== undefined
  );
}

export function isWebSocketUnsubscribeParams(
  parameters: unknown,
): parameters is Record<string, never> {
  return (
    parameters !== undefined &&
    parameters === Object(parameters) &&
    Object.keys(parameters as Record<string, never>).length === 0
  );
}

export enum EventPhase {
  ADDED = 'ADDED',
  MODIFIED = 'MODIFIED',
  DELETED = 'DELETED',
  ERROR = 'ERROR',
}

export type DevWorkspaceMessage = {
  eventPhase: EventPhase.ADDED | EventPhase.MODIFIED | EventPhase.DELETED;
  devWorkspace: V1alpha2DevWorkspace;
};
export type EventMessage = {
  eventPhase: EventPhase.ADDED | EventPhase.MODIFIED | EventPhase.DELETED;
  event: CoreV1Event;
};
export type PodMessage = {
  eventPhase: EventPhase.ADDED | EventPhase.MODIFIED | EventPhase.DELETED;
  pod: V1Pod;
};
export type StatusMessage = {
  eventPhase: EventPhase.ERROR;
  status: V1Status;
};
export type NotificationMessage =
  | EventMessage
  | DevWorkspaceMessage
  | PodMessage
  | StatusMessage;
export type EventData = {
  channel: Channel;
  message: NotificationMessage;
};

export function isWebSocketEventData(message: unknown): message is EventData {
  return (
    message !== undefined &&
    isWebSocketChannel((message as EventData).channel) &&
    isNotificationMessage((message as EventData).message)
  );
}

export function isNotificationMessage(
  message: unknown,
): message is NotificationMessage {
  return (
    message !== undefined &&
    ((message as NotificationMessage).eventPhase === EventPhase.ADDED ||
      (message as NotificationMessage).eventPhase === EventPhase.MODIFIED ||
      (message as NotificationMessage).eventPhase === EventPhase.DELETED ||
      (message as NotificationMessage).eventPhase === EventPhase.ERROR)
  );
}

export function isDevWorkspaceMessage(
  message: unknown,
): message is DevWorkspaceMessage {
  return (
    message !== undefined &&
    ((message as DevWorkspaceMessage).eventPhase === EventPhase.ADDED ||
      (message as DevWorkspaceMessage).eventPhase === EventPhase.MODIFIED ||
      (message as DevWorkspaceMessage).eventPhase === EventPhase.DELETED) &&
    (message as DevWorkspaceMessage).devWorkspace !== undefined
  );
}

export function isEventMessage(message: unknown): message is EventMessage {
  return (
    message !== undefined &&
    ((message as EventMessage).eventPhase === EventPhase.ADDED ||
      (message as EventMessage).eventPhase === EventPhase.MODIFIED ||
      (message as EventMessage).eventPhase === EventPhase.DELETED) &&
    (message as EventMessage).event !== undefined
  );
}

export function isPodMessage(message: unknown): message is PodMessage {
  return (
    message !== undefined &&
    ((message as PodMessage).eventPhase === EventPhase.ADDED ||
      (message as PodMessage).eventPhase === EventPhase.MODIFIED ||
      (message as PodMessage).eventPhase === EventPhase.DELETED) &&
    (message as PodMessage).pod !== undefined
  );
}

export function isStatusMessage(message: unknown): message is StatusMessage {
  return (
    message !== undefined &&
    (message as StatusMessage).eventPhase === EventPhase.ERROR &&
    (message as StatusMessage).status !== undefined
  );
}
