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

import { webSocket } from '..';
import {
  Channel,
  isDevWorkspaceMessage,
  isEventMessage,
  isNotificationMessage,
  isPodMessage,
  isStatusMessage,
  isWebSocketChannel,
  isWebSocketEventData,
  isWebSocketSubscribeParams,
  isWebSocketSubscriptionMessage,
  isWebSocketSubscriptionMethod,
  isWebSocketUnsubscribeParams,
} from '../webSocket';

describe('api.webSocket typeguards', () => {
  test('isWebSocketChannel', () => {
    expect(isWebSocketChannel(Channel.DEV_WORKSPACE)).toBeTruthy();

    expect(isWebSocketChannel(Channel.EVENT)).toBeTruthy();

    expect(isWebSocketChannel(Channel.POD)).toBeTruthy();

    expect(isWebSocketChannel(undefined)).toBeFalsy();
    expect(isWebSocketChannel('foo')).toBeFalsy();
  });

  test('isWebSocketSubscriptionMethod', () => {
    expect(isWebSocketSubscriptionMethod('SUBSCRIBE')).toBeTruthy();

    expect(isWebSocketSubscriptionMethod('UNSUBSCRIBE')).toBeTruthy();

    expect(isWebSocketSubscriptionMethod(undefined)).toBeFalsy();
    expect(isWebSocketSubscriptionMethod('foo')).toBeFalsy();
  });

  test('isWebSocketSubscriptionMessage', () => {
    expect(
      isWebSocketSubscriptionMessage({
        method: 'SUBSCRIBE',
        params: {
          namespace: 'foo',
          resourceVersion: 'bar',
        },
        channel: Channel.DEV_WORKSPACE,
      }),
    ).toBeTruthy();

    expect(
      isWebSocketSubscriptionMessage({
        method: 'UNSUBSCRIBE',
        params: {},
        channel: Channel.DEV_WORKSPACE,
      }),
    ).toBeTruthy();

    expect(isWebSocketSubscriptionMessage(undefined)).toBeFalsy();
    expect(isWebSocketSubscriptionMessage({})).toBeFalsy();
    expect(isWebSocketSubscriptionMessage('foo')).toBeFalsy();
  });

  test('isWebSocketSubscribeParams', () => {
    expect(
      isWebSocketSubscribeParams({
        namespace: 'foo',
        resourceVersion: 'bar',
      }),
    ).toBeTruthy();

    expect(isWebSocketSubscribeParams(undefined)).toBeFalsy();
    expect(isWebSocketSubscribeParams({})).toBeFalsy();
    expect(isWebSocketSubscribeParams('foo')).toBeFalsy();
  });

  test('isWebSocketUnsubscribeParams', () => {
    expect(isWebSocketUnsubscribeParams({})).toBeTruthy();

    expect(isWebSocketUnsubscribeParams(undefined)).toBeFalsy();
    expect(isWebSocketUnsubscribeParams('foo')).toBeFalsy();
    expect(isWebSocketUnsubscribeParams({ foo: 'bar' })).toBeFalsy();
  });

  test('isNotificationMessage', () => {
    expect(
      isNotificationMessage({ eventPhase: webSocket.EventPhase.ADDED }),
    ).toBeTruthy();
    expect(
      isNotificationMessage({ eventPhase: webSocket.EventPhase.DELETED }),
    ).toBeTruthy();
    expect(
      isNotificationMessage({ eventPhase: webSocket.EventPhase.ERROR }),
    ).toBeTruthy();
    expect(
      isNotificationMessage({ eventPhase: webSocket.EventPhase.MODIFIED }),
    ).toBeTruthy();

    expect(isNotificationMessage(undefined)).toBeFalsy();
    expect(isNotificationMessage({})).toBeFalsy();
    expect(isNotificationMessage({ eventPhase: undefined })).toBeFalsy();
    expect(isNotificationMessage({ eventPhase: 'foo' })).toBeFalsy();
  });

  test('isDevWorkspaceMessage', () => {
    expect(
      isDevWorkspaceMessage({
        eventPhase: webSocket.EventPhase.ADDED,
        devWorkspace: {},
      }),
    ).toBeTruthy();
    expect(
      isDevWorkspaceMessage({
        eventPhase: webSocket.EventPhase.DELETED,
        devWorkspace: {},
      }),
    ).toBeTruthy();
    expect(
      isDevWorkspaceMessage({
        eventPhase: webSocket.EventPhase.MODIFIED,
        devWorkspace: {},
      }),
    ).toBeTruthy();

    expect(isDevWorkspaceMessage(undefined)).toBeFalsy();
    expect(isDevWorkspaceMessage({})).toBeFalsy();
    expect(
      isDevWorkspaceMessage({
        eventPhase: webSocket.EventPhase.ADDED,
      }),
    ).toBeFalsy();
    expect(
      isDevWorkspaceMessage({
        devWorkspace: {},
      }),
    ).toBeFalsy();
  });

  test('isEventMessage', () => {
    expect(
      isEventMessage({
        eventPhase: webSocket.EventPhase.ADDED,
        event: {},
      }),
    ).toBeTruthy();
    expect(
      isEventMessage({
        eventPhase: webSocket.EventPhase.DELETED,
        event: {},
      }),
    ).toBeTruthy();
    expect(
      isEventMessage({
        eventPhase: webSocket.EventPhase.MODIFIED,
        event: {},
      }),
    ).toBeTruthy();

    expect(isEventMessage(undefined)).toBeFalsy();
    expect(isEventMessage({})).toBeFalsy();
    expect(
      isEventMessage({
        eventPhase: webSocket.EventPhase.ADDED,
      }),
    ).toBeFalsy();
    expect(
      isEventMessage({
        event: {},
      }),
    ).toBeFalsy();
  });

  test('isPodMessage', () => {
    expect(
      isPodMessage({
        eventPhase: webSocket.EventPhase.ADDED,
        pod: {},
      }),
    ).toBeTruthy();
    expect(
      isPodMessage({
        eventPhase: webSocket.EventPhase.DELETED,
        pod: {},
      }),
    ).toBeTruthy();
    expect(
      isPodMessage({
        eventPhase: webSocket.EventPhase.MODIFIED,
        pod: {},
      }),
    ).toBeTruthy();

    expect(isPodMessage(undefined)).toBeFalsy();
    expect(isPodMessage({})).toBeFalsy();
    expect(
      isPodMessage({
        eventPhase: webSocket.EventPhase.ADDED,
      }),
    ).toBeFalsy();
    expect(
      isPodMessage({
        pod: {},
      }),
    ).toBeFalsy();
  });

  test('isStatusMessage', () => {
    expect(
      isStatusMessage({
        eventPhase: webSocket.EventPhase.ERROR,
        status: {},
      }),
    ).toBeTruthy();

    expect(isStatusMessage(undefined)).toBeFalsy();
    expect(isStatusMessage({})).toBeFalsy();
    expect(
      isStatusMessage({
        eventPhase: webSocket.EventPhase.ERROR,
      }),
    ).toBeFalsy();
    expect(
      isStatusMessage({
        pod: {},
      }),
    ).toBeFalsy();
  });

  test('isWebSocketEventData', () => {
    expect(
      isWebSocketEventData({
        channel: Channel.EVENT,
        message: {
          eventPhase: webSocket.EventPhase.ADDED,
          event: {},
        },
      }),
    ).toBeTruthy();

    expect(isWebSocketEventData(undefined)).toBeFalsy();
    expect(isWebSocketEventData({})).toBeFalsy();
    expect(isWebSocketEventData('foo')).toBeFalsy();
  });
});
