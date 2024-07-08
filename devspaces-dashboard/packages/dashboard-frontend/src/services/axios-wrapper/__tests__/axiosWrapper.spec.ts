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

import common from '@eclipse-che/common';
import mockAxios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import {
  AxiosWrapper,
  bearerTokenAuthorizationIsRequiredErrorMsg,
} from '@/services/axios-wrapper/axiosWrapper';
import * as helpers from '@/services/helpers/delay';

// mute console logs
console.log = jest.fn();
console.warn = jest.fn();

describe('axiosWrapper', () => {
  let axiosInstance: AxiosInstance;
  let axiosGetMock: jest.Mock;
  let axiosGetSpy: jest.SpyInstance;
  let delaySpy: jest.SpyInstance;

  beforeEach(() => {
    axiosInstance = mockAxios;
    axiosGetMock = jest.fn();
    axiosInstance.get = axiosGetMock;
    axiosGetSpy = jest.spyOn(axiosInstance, 'get');
    delaySpy = jest.spyOn(helpers, 'delay').mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should retry 0 time with Bearer Token Authorization is required error message', async () => {
    const expectedData = { data: 'some-data' };
    axiosGetMock.mockReturnValue(new Promise(resolve => resolve(expectedData)));

    const result = await new AxiosWrapper(
      axiosInstance,
      bearerTokenAuthorizationIsRequiredErrorMsg,
    ).get('some-url');

    expect(result).toEqual(expectedData);
    expect(axiosGetSpy).toHaveBeenCalledTimes(1);
  });

  it('should retry 0 time without specific error message', async () => {
    const expectedData = { data: 'some-data' };
    axiosGetMock.mockReturnValue(new Promise(resolve => resolve(expectedData)));

    const result = await new AxiosWrapper(axiosInstance).get('some-url');

    expect(result).toEqual(expectedData);
    expect(axiosGetSpy).toHaveBeenCalledTimes(1);
  });

  it('should retry 1 time with Bearer Token Authorization is required error message', async () => {
    const expectedData = { data: 'some-data' };
    axiosGetMock
      .mockRejectedValueOnce(new Error(bearerTokenAuthorizationIsRequiredErrorMsg))
      .mockReturnValue(new Promise(resolve => resolve(expectedData)));

    const result = await new AxiosWrapper(
      axiosInstance,
      bearerTokenAuthorizationIsRequiredErrorMsg,
    ).get('some-url');

    expect(result).toEqual(expectedData);
    expect(axiosGetSpy).toHaveBeenCalledTimes(2);
  });

  it('should retry 1 time with Bearer Token Authorization is required axios response error message', async () => {
    const expectedData = { data: 'some-data' };
    axiosGetMock
      .mockRejectedValueOnce(createAxiosResponseError(bearerTokenAuthorizationIsRequiredErrorMsg))
      .mockReturnValue(new Promise(resolve => resolve(expectedData)));

    const result = await new AxiosWrapper(
      axiosInstance,
      bearerTokenAuthorizationIsRequiredErrorMsg,
    ).get('some-url');

    expect(result).toEqual(expectedData);
    expect(axiosGetSpy).toHaveBeenCalledTimes(2);
  });

  it('should retry 1 time without specifc error message', async () => {
    const expectedData = { data: 'some-data' };
    axiosGetMock
      .mockRejectedValueOnce(new Error('some error message'))
      .mockReturnValue(new Promise(resolve => resolve(expectedData)));

    const result = await new AxiosWrapper(axiosInstance).get('some-url');

    expect(result).toEqual(expectedData);
    expect(axiosGetSpy).toHaveBeenCalledTimes(2);
  });

  it('should retry 2 times with Bearer Token Authorization is required error message', async () => {
    const expectedData = { data: 'some-data' };
    axiosGetMock
      .mockRejectedValueOnce(new Error(bearerTokenAuthorizationIsRequiredErrorMsg))
      .mockRejectedValueOnce(new Error(bearerTokenAuthorizationIsRequiredErrorMsg))
      .mockReturnValue(new Promise(resolve => resolve(expectedData)));

    const result = await new AxiosWrapper(
      axiosInstance,
      bearerTokenAuthorizationIsRequiredErrorMsg,
    ).get('some-url');

    expect(result).toEqual(expectedData);
    expect(axiosGetSpy).toHaveBeenCalledTimes(3);
  });

  it('should retry 2 times with Bearer Token Authorization is required axios response error message', async () => {
    const expectedData = { data: 'some-data' };
    axiosGetMock
      .mockRejectedValueOnce(createAxiosResponseError(bearerTokenAuthorizationIsRequiredErrorMsg))
      .mockRejectedValueOnce(createAxiosResponseError(bearerTokenAuthorizationIsRequiredErrorMsg))
      .mockReturnValue(new Promise(resolve => resolve(expectedData)));

    const result = await new AxiosWrapper(
      axiosInstance,
      bearerTokenAuthorizationIsRequiredErrorMsg,
    ).get('some-url');

    expect(result).toEqual(expectedData);
    expect(axiosGetSpy).toHaveBeenCalledTimes(3);
  });

  it('should retry 2 times without specific error message', async () => {
    const expectedData = { data: 'some-data' };
    axiosGetMock
      .mockRejectedValueOnce(new Error('error 1'))
      .mockRejectedValueOnce(new Error('error 2'))
      .mockReturnValue(new Promise(resolve => resolve(expectedData)));

    const result = await new AxiosWrapper(axiosInstance).get('some-url');

    expect(result).toEqual(expectedData);
    expect(axiosGetSpy).toHaveBeenCalledTimes(3);
  });

  it('should fail after 3 times with Bearer Token Authorization is required error message', async () => {
    axiosGetMock
      .mockRejectedValueOnce(new Error(bearerTokenAuthorizationIsRequiredErrorMsg))
      .mockRejectedValueOnce(new Error(bearerTokenAuthorizationIsRequiredErrorMsg))
      .mockRejectedValueOnce(new Error(bearerTokenAuthorizationIsRequiredErrorMsg))
      .mockRejectedValue(new Error(bearerTokenAuthorizationIsRequiredErrorMsg));

    try {
      await new AxiosWrapper(axiosInstance, bearerTokenAuthorizationIsRequiredErrorMsg).get(
        'some-url',
      );
      fail('should fail');
    } catch (e: any) {
      expect(e.message).toEqual(bearerTokenAuthorizationIsRequiredErrorMsg);
      expect(axiosGetSpy).toHaveBeenCalledTimes(4);
    }
  });

  it('should fail after 3 times with Bearer Token Authorization is required axios response error message', async () => {
    axiosGetMock
      .mockRejectedValueOnce(createAxiosResponseError(bearerTokenAuthorizationIsRequiredErrorMsg))
      .mockRejectedValueOnce(createAxiosResponseError(bearerTokenAuthorizationIsRequiredErrorMsg))
      .mockRejectedValueOnce(createAxiosResponseError(bearerTokenAuthorizationIsRequiredErrorMsg))
      .mockRejectedValue(createAxiosResponseError(bearerTokenAuthorizationIsRequiredErrorMsg));

    try {
      await new AxiosWrapper(axiosInstance, bearerTokenAuthorizationIsRequiredErrorMsg).get(
        'some-url',
      );
      fail('should fail');
    } catch (e: any) {
      expect(common.helpers.errors.includesAxiosResponse(e)).toBeTruthy();
      expect(e.response.data).toEqual(bearerTokenAuthorizationIsRequiredErrorMsg);
      expect(axiosGetSpy).toHaveBeenCalledTimes(4);
    }
  });

  it('should fail after 3 times without specific error message', async () => {
    axiosGetMock
      .mockRejectedValueOnce(new Error('error 1'))
      .mockRejectedValueOnce(new Error('error 2'))
      .mockRejectedValueOnce(new Error('error 3'))
      .mockRejectedValue(new Error('error 4'));

    try {
      await new AxiosWrapper(axiosInstance).get('some-url');
      fail('should fail');
    } catch (e: any) {
      expect(e.message).toEqual('error 4');
      expect(axiosGetSpy).toHaveBeenCalledTimes(4);
    }
  });

  it('should have retry delay increase exponentially', async () => {
    axiosGetMock
      .mockRejectedValueOnce(new Error('error 1'))
      .mockRejectedValueOnce(new Error('error 2'))
      .mockRejectedValueOnce(new Error('error 3'))
      .mockRejectedValue(new Error('error 4'));

    try {
      await new AxiosWrapper(axiosInstance).get('some-url');
      fail('should fail');
    } catch (e: any) {
      expect(delaySpy).toHaveBeenCalledTimes(3);
      expect(delaySpy.mock.calls).toEqual([[500], [1000], [2000]]);
    }
  });
});

function createAxiosResponseError(message: string): { response: AxiosResponse } {
  return {
    response: {
      data: message,
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    },
  };
}
