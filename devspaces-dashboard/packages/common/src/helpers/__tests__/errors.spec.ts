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

import axios, { AxiosError, AxiosResponse } from 'axios';
import { HttpError } from '@kubernetes/client-node';
import AxiosMockAdapter from 'axios-mock-adapter';
import * as http from 'http';
import { getMessage, isAxiosError, isError } from '../errors';

const mockAxios = new AxiosMockAdapter(axios);

describe('Errors helper', () => {
  // mute the outputs
  console.error = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
    mockAxios.resetHandlers();
  });

  describe('Typeguards', () => {
    it('should check if error', () => {
      const message = 'Expected error.';
      const error = new Error(message);
      expect(isError(error)).toEqual(true);
      expect(isError(message)).toEqual(false);
    });

    it('should check if axios error', () => {
      const message = 'Expected error.';
      const error = new Error(message) as AxiosError;
      error.isAxiosError = true;
      expect(isAxiosError(error)).toEqual(true);
    });
  });

  it('should return default message', () => {
    expect(getMessage(undefined)).toEqual('Error is not specified.');
  });

  it('should return message', () => {
    const message = 'Expected error message.';
    expect(getMessage(message)).toEqual(message);
  });

  it('should return error message', () => {
    const message = 'Expected error.';
    const error = new Error(message);
    expect(getMessage(error)).toEqual(message);
  });

  it('should return default message and dump the provided object', () => {
    const notError = { alert: 'Beware of bugs!' };

    const expectedMessage =
      'Unexpected error. Check DevTools console and network tabs for more information.';
    expect(getMessage(notError)).toEqual(expectedMessage);

    const expectedOutput = ['Unexpected error:', { alert: 'Beware of bugs!' }];
    expect(console.error).toBeCalledWith(...expectedOutput);
  });

  describe('Frontend errors', () => {
    it('should return error message if server responds with error #1', async done => {
      const message = '"500 Internal Server Error" returned by "/location/".';

      mockAxios.onGet('/location/').replyOnce(() => {
        return [500, {}, {}];
      });

      try {
        await axios.get('/location/');
        done.fail();
      } catch (e) {
        const err = e as AxiosError;
        // provide `statusText` to the response because mocking library cannot do that
        (err.response as AxiosResponse<unknown>).statusText =
          'Internal Server Error';

        expect(getMessage(err)).toEqual(message);
        done();
      }
    });

    it('should return error message if server responds with error #2', async done => {
      const message = 'The server failed to fulfill a request';

      mockAxios.onGet('/location/').replyOnce(() => {
        return [500, { message }, {}];
      });

      try {
        await axios.get('/location/');
        done.fail();
      } catch (e) {
        const err = e as AxiosError;
        // provide `statusText` to the response because mocking library cannot do that
        (err.response as AxiosResponse<unknown>).statusText =
          'Internal Server Error';

        expect(getMessage(err)).toEqual(message);
        done();
      }
    });

    it('should return error message if server responds with error #3', async done => {
      const message = '"500 Internal Server Error".';

      mockAxios.onGet('/location/').replyOnce(() => {
        return [500, {}, {}];
      });

      try {
        await axios.get('/location/');
        done.fail();
      } catch (e) {
        const err = e as AxiosError;
        // provide `statusText` to the response because mocking library cannot do that
        (err.response as AxiosResponse<unknown>).statusText =
          'Internal Server Error';
        delete err.config.url;

        expect(getMessage(err)).toEqual(message);
        done();
      }
    });

    it('should return error message if network error', async done => {
      const message = 'Network Error';

      mockAxios.onGet('/location/').networkErrorOnce();

      try {
        await axios.get('/location/');
        done.fail();
      } catch (e) {
        expect(getMessage(e)).toEqual(message);
        done();
      }
    });

    it('should return error message if network timeout', async done => {
      const message = 'timeout of 0ms exceeded';

      mockAxios.onGet('/location/').timeoutOnce();

      try {
        await axios.get('/location/');
        done.fail();
      } catch (e) {
        expect(getMessage(e)).toEqual(message);
        done();
      }
    });

    it('should return error message if request aborted', async done => {
      const message = 'Request aborted';

      mockAxios.onGet('/location/').abortRequestOnce();

      try {
        await axios.get('/location/');
        done.fail();
      } catch (e) {
        expect(getMessage(e)).toEqual(message);
        done();
      }
    });
  });

  describe('Backend errors', () => {
    it('should return error message if no response available', () => {
      const error: HttpError = {
        name: 'HttpError',
        message: 'HttpError message',
        response: {
          url: '/location/',
        } as http.IncomingMessage,
        body: 'No response available',
        statusCode: -1,
      };
      const expectedMessage = 'no response available due to network issue.';
      expect(getMessage(error)).toEqual(expectedMessage);

      delete error.statusCode;
      expect(getMessage(error)).toEqual(expectedMessage);
    });

    it('should return error message if message from K8s is present', () => {
      const expectedMessage = 'Error message from K8s.';
      const error: HttpError = {
        name: 'HttpError',
        message: 'HttpError message',
        response: {
          url: '/location/',
        } as http.IncomingMessage,
        body: {
          message: expectedMessage,
        },
        statusCode: 500,
      };
      expect(getMessage(error)).toEqual(expectedMessage);
    });

    it('should return error message if message in response body is present', () => {
      const expectedMessage = 'Error message from K8s.';
      const error: HttpError = {
        name: 'HttpError',
        message: 'HttpError message',
        response: {
          url: '/location/',
        } as http.IncomingMessage,
        body: expectedMessage,
        statusCode: 500,
      };
      expect(getMessage(error)).toEqual(expectedMessage);
    });

    it('should return error message if `statusCode` is present', () => {
      const expectedMessage = '"500" returned by "/location/".';
      const error: HttpError = {
        name: 'HttpError',
        message: expectedMessage,
        response: {
          url: '/location/',
        } as http.IncomingMessage,
        body: undefined,
        statusCode: 500,
      };
      expect(getMessage(error)).toEqual(expectedMessage);
    });

    it('should return error message if `response.body.message` is present', () => {
      const expectedMessage =
        'Secrets "devworkspace-container-registry-dockercfg" already exist.';
      const error: HttpError = {
        name: 'HttpError',
        message: 'HttpError message',
        response: {
          url: '/location/',
          body: {
            message: expectedMessage,
          },
        } as any,
        body: undefined,
        statusCode: 409,
      };
      expect(getMessage(error)).toEqual(expectedMessage);
    });

    it('should return default error message if `response.body` is undefined', () => {
      const error: HttpError = {
        name: 'HttpError',
        message: 'HttpError message',
        response: {
          url: '/location/',
        } as any,
        body: undefined,
        statusCode: 409,
      };
      expect(getMessage(error)).toEqual('"409" returned by "/location/".');
    });

    it('should return default error message if `response.body.message` is undefined', () => {
      const error: HttpError = {
        name: 'HttpError',
        message: 'HttpError message',
        response: {
          url: '/location/',
          body: {
            message: undefined,
          },
        } as any,
        body: undefined,
        statusCode: 409,
      };
      expect(getMessage(error)).toEqual('"409" returned by "/location/".');
    });

    it('should return `error.body` as a message if it is a string', () => {
      const expectedMessage = 'Test message.';
      const error = {
        name: 'HttpError',
        message: 'HttpError message',
        response: {
          url: '/location/',
        } as http.IncomingMessage,
        body: 'Test message.',
        statusCode: 409,
      };
      expect(getMessage(error)).toEqual(expectedMessage);
    });

    it('should return default response message if `error.body` is object and `error.body.message` is undefined', () => {
      const expectedMessage = '"409" returned by "/location/".';
      const error = {
        name: 'HttpError',
        message: 'HttpError message',
        response: {
          url: '/location/',
        } as http.IncomingMessage,
        body: {
          test: 'test',
        },
        statusCode: 409,
      };
      expect(getMessage(error)).toEqual(expectedMessage);
    });

    it('should return response message if `error.response.data` is present', () => {
      const expectedMessage =
        'Creating the namespace "user-che" is not allowed, yet it was not found.';
      const error = {
        name: 'Error',
        config: {},
        request: {},
        response: {
          data: expectedMessage,
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: {},
          request: {},
        },
        message: '"500" returned by "/kubernetes/namespace/provision".',
      };
      expect(getMessage(error)).toEqual(expectedMessage);
    });
  });
});
