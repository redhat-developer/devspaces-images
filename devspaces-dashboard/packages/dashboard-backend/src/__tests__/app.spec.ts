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

import process from 'process';

import { setup, teardown } from '@/utils/appBuilder';

const mockProcessExit = jest.fn();
(process as any).exit = mockProcessExit.mockImplementation(code => {
  throw new Error('exit code ' + code);
});

describe('App', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('start when CHE_HOST is empty', async () => {
    // one error should be thrown
    expect.assertions(1);
    try {
      const app = await setup({
        env: {
          CHE_HOST: '',
        },
      });
      teardown(app);
    } catch (e) {
      expect((e as Error).message).toMatch('exit code 1');
    }
  });

  test('start when CHE_HOST is set', async () => {
    // no errors should be thrown
    expect.assertions(0);
    try {
      const app = await setup();
      teardown(app);
    } catch (e) {
      expect((e as Error).message).toMatch('exit code 1');
    }
  });
});
