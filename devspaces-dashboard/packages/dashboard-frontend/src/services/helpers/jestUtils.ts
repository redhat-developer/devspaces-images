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

// see https://github.com/facebook/jest/issues/2157#issuecomment-279171856
async function flushPromises(): Promise<void> {
  return new Promise(res => setImmediate(res));
}

export async function advanceTimersByTime(time: number): Promise<void> {
  jest.advanceTimersByTime(time);
  await flushPromises();
}
