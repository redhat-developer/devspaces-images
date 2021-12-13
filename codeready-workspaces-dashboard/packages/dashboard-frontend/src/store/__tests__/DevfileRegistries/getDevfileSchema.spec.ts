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

import getDevfileSchema from '../../DevfileRegistries/getDevfileSchema';
import { JSONSchema7 } from 'json-schema';
import { cloneDeep } from 'lodash';

describe('Get devfile schema', () => {
  it('Should return unmodified schema if the schemaVersion property includes a constant', async () => {
    const schemaWithVersionConst = {
      description: 'Devfile describes the structure...',
      type: 'object',
      title: 'Devfile schema',
      properties: {
        schemaVersion: {
          description: 'Devfile schema version',
          type: 'string',
          const: '2.0.0',
        },
        components: {
          type: 'array',
        },
      },
    } as JSONSchema7;

    const targetScheme = await getDevfileSchema(version => {
      const cloneObj = cloneDeep(schemaWithVersionConst);
      return Promise.resolve(cloneObj);
    }, '2.0.0');

    expect(targetScheme).toEqual(schemaWithVersionConst);
  });

  it('Should return modified schema if the schemaVersion property does not include a constant', async () => {
    const schemaWithoutVersionConst = {
      description: 'Devfile describes the structure...',
      type: 'object',
      title: 'Devfile schema',
      properties: {
        schemaVersion: {
          description: 'Devfile schema version',
          type: 'string',
        },
        components: {
          type: 'array',
        },
      },
    } as JSONSchema7;

    const targetScheme = await getDevfileSchema(version => {
      const cloneObj = cloneDeep(schemaWithoutVersionConst);
      return Promise.resolve(cloneObj);
    }, '2.0.0');

    expect(targetScheme).not.toEqual(schemaWithoutVersionConst);

    expect(targetScheme).toEqual({
      description: 'Devfile describes the structure...',
      type: 'object',
      title: 'Devfile schema',
      properties: {
        schemaVersion: {
          description: 'Devfile schema version',
          type: 'string',
          const: '2.0.0',
        },
        components: {
          type: 'array',
        },
      },
    });
  });
});
