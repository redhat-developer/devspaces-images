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

import { authenticationHeaderSchema } from '@/constants/schemas';
import * as helpers from '@/services/helpers';

describe('helpers', () => {
  test('delay', async () => {
    jest.useFakeTimers();

    const mockCallback = jest.fn();
    const promise = helpers.delay(1000).then(mockCallback);

    await jest.advanceTimersByTimeAsync(500);
    expect(mockCallback).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(500);
    expect(promise).resolves.toBeUndefined();
    expect(mockCallback).toHaveBeenCalled();

    jest.useRealTimers();
  });

  test('getSchema', () => {
    const schema = helpers.getSchema({
      tags: ['test'],
      namespacedSchema: {
        type: 'object',
        properties: {
          namespace: {
            type: 'string',
          },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      },
    });

    expect(schema).toEqual({
      schema: {
        headers: authenticationHeaderSchema,
        namespacedSchema: {
          properties: {
            namespace: {
              type: 'string',
            },
          },
          type: 'object',
        },
        security: [
          {
            Authorization: '',
          },
        ],
        tags: ['test'],
        body: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
        },
      },
    });
  });

  test('createFastifyError', () => {
    const error = helpers.createFastifyError('test', '500');
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toEqual(500);
  });
});
