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

export type IResolveFn<T> = {
  (value?: T | PromiseLike<T>): void;
}

export type IRejectFn<T> = {
  (reason?: any): void;
}

/**
 * Provides a Defer object.
 */
export type IDeferred<T> = {
  resolve(value?: T | Promise<T>): void;
  reject(reason?: any): void;
  promise: Promise<T>;
}

export const getDefer = <T>(): IDeferred<T> => {
  const defer: { [param: string]: any } = {};
  defer.promise = new Promise((resolve: IResolveFn<T>, reject: IRejectFn<any>) => {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  return defer as IDeferred<T>;
};
