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
// eslint-disable-next-line notice/notice
import { retryableExec } from '../retryableExec';

describe('Retryable Exec', () => {
  let attempt: number;

  beforeEach(() => {
    attempt = 0;
  });

  test('execute only once if it is a success', async () => {
    let attempt = 0;
    const callback = async () => {
      attempt++;
      return attempt;
    };
    const res = await retryableExec(callback);
    expect(res).toEqual(1);
  });

  test('retry 5 times as a default', async () => {
    const callback = async () => {
      attempt++;
      return new Error(attempt.toString());
    };
    try {
      await retryableExec(callback);
    } catch (e) {
      expect(e).toEqual('5');
    }
  });

  test('retry custom max attempts times', async () => {
    const maxAttempt = 15;
    const callback = async () => {
      attempt++;
      return new Error(attempt.toString());
    };
    try {
      await retryableExec(callback, maxAttempt);
    } catch (e) {
      expect(e).toEqual(maxAttempt.toString());
    }
  });
});
