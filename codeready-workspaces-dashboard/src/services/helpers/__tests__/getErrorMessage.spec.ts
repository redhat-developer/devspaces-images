/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { getErrorMessage } from '../getErrorMessage';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

describe('helper getErrorMessage()', () => {

  it('should return empty string', () => {
    const errorMessage = getErrorMessage(undefined as any);
    expect(errorMessage).toEqual('');
  });

  it('should return error message', () => {
    const errorMessage = 'error message';
    const error = new Error(errorMessage);
    expect(getErrorMessage(error)).toEqual(errorMessage);
  });

  it('should return axios error message', () => {
    const errorMessage = 'axios error message';
    const error: AxiosError = {
      config: {} as AxiosRequestConfig,
      isAxiosError: true,
      message: errorMessage,
      name: 'test error',
      toJSON: () => ({}),
    };
    expect(getErrorMessage(error)).toEqual(errorMessage);
  });

  it('should return che server error message', () => {
    const errorMessage = 'che-server error message';
    const errorResponse = {
      status: 403,
      data: {
        message: errorMessage,
      },

    } as AxiosResponse;
    expect(getErrorMessage(errorResponse)).toEqual(errorMessage);
  });

  it('should return stringified axios response data', () => {
    const errorResponse = {
      status: 418,
      data: [
        'green', 'white', 'yellow', 'oolong', 'black',
      ],

    } as AxiosResponse;
    expect(getErrorMessage(errorResponse)).toEqual(JSON.stringify(errorResponse.data));
  });

  it('should return stringified object', () => {
    const object = {
      description: 'not an error!',
    } as any;
    expect(getErrorMessage(object)).toEqual(JSON.stringify(object));
  });

});
