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

/**
 * Provides a Defer object.
 */
export type IDeferred<T> = {
  resolve(value?: T | PromiseLike<T>): void;
  reject(reason?: any): void;
  promise: Promise<T>;
};

export const getDefer = <T>(): IDeferred<T> => {
  const defer = {} as IDeferred<T>;
  defer.promise = new Promise<T>((resolve, reject) => {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  return defer as IDeferred<T>;
};
