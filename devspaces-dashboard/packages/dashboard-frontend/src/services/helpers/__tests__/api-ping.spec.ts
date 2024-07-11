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

import axios from 'axios';

import { isAvailableEndpoint } from '@/services/helpers/api-ping';

jest.mock('axios');

const delayMock = jest.fn();
jest.mock('../delay', () => ({
  delay: ms => delayMock(ms),
}));

describe('test API endpoints', () => {
  // mute the outputs
  console.error = jest.fn();
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const endpoint = 'https://example.com/developer-image/3100/';

  beforeEach(() => {
    jest.useFakeTimers();
    delayMock.mockResolvedValue(Promise.resolve());
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('should return "false" if endpoint undefined', async () => {
    const isAvailable = await isAvailableEndpoint(undefined);

    expect(delayMock).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(isAvailable).toBeFalsy();
  });

  it('should return "true" if response status 200', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      status: 200,
      data: 'some payload',
    });

    const isAvailable = await isAvailableEndpoint(endpoint);

    expect(delayMock).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(isAvailable).toBeTruthy();
  });

  it('should return "true" if response status 401', async () => {
    axios.get = jest.fn().mockRejectedValueOnce({
      response: {
        headers: {},
        status: 401,
        config: {},
        statusText: '401 Unauthorized',
        data: { message: 'Error: 401 Unauthorized.' },
      },
    });

    const isAvailable = await isAvailableEndpoint(endpoint);

    expect(delayMock).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(isAvailable).toBeTruthy();
  });

  it('should return "true" if response status 403', async () => {
    mockedAxios.get = jest.fn().mockRejectedValueOnce({
      response: {
        headers: {},
        status: 403,
        config: {},
        statusText: '403 Forbidden',
        data: { message: 'Error: 403 Forbidden.' },
      },
    });

    const isAvailable = await isAvailableEndpoint(endpoint);

    expect(delayMock).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(isAvailable).toBeTruthy();
  });

  it('should return "false" if response status 503', async () => {
    mockedAxios.get = jest.fn().mockRejectedValue({
      response: {
        headers: {},
        status: 503,
        config: {},
        statusText: '503 Service Unavailable',
        data: { message: 'Error: 503 Service Unavailable.' },
      },
    });

    const isAvailable = await isAvailableEndpoint(endpoint);

    expect(delayMock).toHaveBeenCalledWith(2500);
    expect(delayMock).toHaveBeenCalledTimes(11);
    expect(console.error).toHaveBeenCalledWith(
      `Endpoint 'https://example.com/developer-image/3100/' is not available. Error: 503 Service Unavailable.`,
    );
    expect(isAvailable).toBeFalsy();
  });

  it('should return "false" if response status 404', async () => {
    mockedAxios.get = jest.fn().mockRejectedValue({
      response: {
        headers: {},
        status: 404,
        config: {},
        statusText: '404 Page Not Found',
        data: { message: 'Error: 404 Page Not Found.' },
      },
    });

    const isAvailable = await isAvailableEndpoint(endpoint);

    expect(delayMock).toHaveBeenCalledWith(2500);
    expect(delayMock).toHaveBeenCalledTimes(11);
    expect(console.error).toHaveBeenCalledWith(
      `Endpoint 'https://example.com/developer-image/3100/' is not available. Error: 404 Page Not Found.`,
    );
    expect(isAvailable).toBeFalsy();
  });
});
