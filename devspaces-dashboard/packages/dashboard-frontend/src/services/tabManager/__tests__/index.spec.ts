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

import { TabManager } from '@/services/tabManager';

const mockWindowOpen = jest.fn();
const mockWindowClose = jest.fn();
const mockWindowReplace = jest.fn();

describe('TabManager', () => {
  let tabManager: TabManager;

  beforeEach(() => {
    tabManager = new TabManager();
    window.open = mockWindowOpen;
    window.close = mockWindowClose;

    const { location } = window;
    delete (window as Partial<Window>).location;
    window.location = {
      origin: location.origin,
      replace: mockWindowReplace,
    } as unknown as Window['location'];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('new tab remains open, switch to it', () => {
    const stubWindowProxy1 = { focus: jest.fn(), closed: false };
    mockWindowOpen.mockReturnValueOnce(stubWindowProxy1);

    const url = window.location.origin + '/new-path';

    tabManager.open(url);
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(url, url);

    tabManager.open(url);
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  test('new tab get closed, switch to it', () => {
    const stubWindowProxy2 = { focus: jest.fn(), closed: true };
    mockWindowOpen.mockReturnValueOnce(stubWindowProxy2);

    const url = window.location.origin + '/new-path';

    tabManager.open(url);
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(url, url);

    tabManager.open(url);
    expect(window.open).toHaveBeenCalledTimes(2);
  });

  test('fail to open new tab', () => {
    mockWindowOpen.mockReturnValueOnce(null);

    const url = window.location.origin + '/new-path';
    tabManager.open(url);

    expect(window.open).toHaveBeenCalledWith(url, url);
    expect(window.location.replace).toHaveBeenCalledWith(url);
  });
});
