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

import { AxiosError, AxiosResponse } from 'axios';
import { HttpError } from '@kubernetes/client-node';

/**
 * This helper function does its best to get an error message from the provided object.
 * @param error An object that supposed to contain an error message, or the error message.
 * @returns Error message
 */
export function getMessage(error: unknown): string {
  if (!error) {
    return 'Error is not specified.';
  }
  if (isKubeClientError(error)) {
    const statusCode = error.statusCode || error.response.statusCode;
    if (!statusCode || statusCode === -1) {
      return 'no response available due to network issue.';
    }
    if (error.body) {
      if (typeof error.body === 'string') {
        // pure http response body without message available
        return error.body;
      }
      if (error.body.message) {
        // body is from K8s in JSON form with message present
        return error.body.message;
      }
    }
    if ((error.response as any).body) {
      // for some reason, the error message could be in response body
      const body = (error.response as any).body;
      if (body && body.message) {
        return body.message;
      }
    }
    return `"${statusCode}" returned by "${error.response.url}".`;
  }

  if (includesAxiosResponse(error)) {
    const response = error.response;
    if (typeof response.data === 'string') {
      return response.data;
    } else if (response.data.message) {
      return response.data.message;
    } else if (response.config.url) {
      return `"${response.status} ${response.statusText}" returned by "${response.config.url}".`;
    } else {
      return `"${response.status} ${response.statusText}".`;
    }
  }

  if (isErrorLike(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  console.error('Unexpected error:', error);
  return 'Unexpected error. Check DevTools console and network tabs for more information.';
}

export function isErrorLike(error: unknown): error is { message: string } {
  return (
    error !== undefined &&
    (error as Error).message !== undefined &&
    typeof (error as Error).message === 'string'
  );
}

export function isError(error: unknown): error is Error {
  return isErrorLike(error) && (error as Error).name !== undefined;
}

export function isAxiosResponse(response: unknown): response is AxiosResponse {
  return (
    response !== undefined &&
    (response as AxiosResponse).status !== undefined &&
    (response as AxiosResponse).statusText !== undefined &&
    (response as AxiosResponse).headers !== undefined &&
    (response as AxiosResponse).config !== undefined &&
    (response as AxiosResponse).data !== undefined
  );
}

type ObjectWithAxiosResponse = {
  response: AxiosResponse;
};
export function includesAxiosResponse(
  obj: unknown,
): obj is ObjectWithAxiosResponse {
  if (
    obj !== undefined &&
    isAxiosResponse((obj as ObjectWithAxiosResponse).response)
  ) {
    return true;
  }
  return false;
}

export function isAxiosError(object: unknown): object is AxiosError {
  return object !== undefined && (object as AxiosError).isAxiosError === true;
}

export function isKubeClientError(error: unknown): error is HttpError {
  return (
    isError(error) &&
    (error as HttpError).response !== undefined &&
    'body' in (error as HttpError)
  );
}
