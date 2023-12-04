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
import { ObjectsWatcher } from '@/services/ObjectsWatcher';

describe('ObjectsWatcher', () => {
  const message = 'message';
  const channel = api.webSocket.Channel.DEV_WORKSPACE;

  const mockListener = jest.fn();
  const mockParams = { param: 'value' };

  const mockStopWatching = jest.fn();
  const mockWatchInNamespace = jest
    .fn()
    .mockImplementation(listener => Promise.resolve(listener(message)));

  let objectsWatcher: ObjectsWatcher<unknown>;

  beforeEach(() => {
    const apiService = {
      stopWatching: () => mockStopWatching(),
      watchInNamespace: (...args) => mockWatchInNamespace(...args),
    } as IWatcherService;
    objectsWatcher = new ObjectsWatcher(apiService, channel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('start watching w/o observer', async () => {
    await objectsWatcher.start('test', mockParams);

    expect(mockWatchInNamespace).toHaveBeenCalledWith(expect.any(Function), mockParams);
  });

  test('watch changes with observer', async () => {
    const observer = {
      update: mockListener,
    };
    objectsWatcher.attach(observer);

    await objectsWatcher.start('test', mockParams);

    expect(mockListener).toHaveBeenCalledWith(channel, 'message');
    expect(mockWatchInNamespace).toHaveBeenCalledWith(expect.any(Function), mockParams);
  });

  test('detach observer', async () => {
    const observer = {
      update: mockListener,
    };
    objectsWatcher.attach(observer);
    objectsWatcher.detach();

    await objectsWatcher.start('test', mockParams);

    expect(mockListener).not.toHaveBeenCalled();
    expect(mockWatchInNamespace).toHaveBeenCalledWith(expect.any(Function), mockParams);
  });

  test('stop watching', async () => {
    objectsWatcher.stop();

    expect(mockStopWatching).toHaveBeenCalled();
  });
});
