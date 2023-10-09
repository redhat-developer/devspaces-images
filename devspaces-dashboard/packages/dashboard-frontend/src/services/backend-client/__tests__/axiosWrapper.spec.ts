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

import { AxiosInstance } from 'axios';
import { AxiosWrapper } from '../axiosWrapper';
import mockAxios from 'axios';

// mute console logs
console.log = jest.fn();
console.warn = jest.fn();

const errorMessage = 'Bearer Token Authorization is required';

describe('axiosWrapper', () => {
  let axiosInstance: AxiosInstance;
  let axiosGetMock: jest.Mock;
  let axiosGetSpy: jest.SpyInstance;

  beforeEach(() => {
    axiosInstance = mockAxios;
    axiosGetMock = jest.fn();
    axiosInstance.get = axiosGetMock;
    axiosGetSpy = jest.spyOn(axiosInstance, 'get');
  });

  it('should retry 0 time', async () => {
    const expectedData = { data: 'some-data' };
    axiosGetMock.mockReturnValue(new Promise(resolve => resolve(expectedData)));

    const result = await new AxiosWrapper(axiosInstance).get('some-url');

    expect(result).toEqual(expectedData);
    expect(axiosGetSpy).toBeCalledTimes(1);
  });

  it('should retry 1 time', async () => {
    const expectedData = { data: 'some-data' };
    axiosGetMock
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockReturnValue(new Promise(resolve => resolve(expectedData)));

    const result = await new AxiosWrapper(axiosInstance).get('some-url');

    expect(result).toEqual(expectedData);
    expect(axiosGetSpy).toBeCalledTimes(2);
  });

  it('should retry 2 times', async () => {
    const expectedData = { data: 'some-data' };
    axiosGetMock
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockReturnValue(new Promise(resolve => resolve(expectedData)));

    const result = await new AxiosWrapper(axiosInstance).get('some-url');

    expect(result).toEqual(expectedData);
    expect(axiosGetSpy).toBeCalledTimes(3);
  });

  it('should fail after 3 times', async () => {
    axiosGetMock
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockRejectedValue(new Error(errorMessage));

    try {
      await new AxiosWrapper(axiosInstance).get('some-url');
      fail('should fail');
    } catch (e: any) {
      expect(e.message).toEqual(errorMessage);
      expect(axiosGetSpy).toBeCalledTimes(4);
    }
  });
});
