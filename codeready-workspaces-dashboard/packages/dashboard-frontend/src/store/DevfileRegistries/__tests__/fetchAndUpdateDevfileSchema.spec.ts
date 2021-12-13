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

import fetchAndUpdateDevfileSchema from '../fetchAndUpdateDevfileSchema';
import { JSONSchema7 } from 'json-schema';
import { cloneDeep } from 'lodash';
import { CheWorkspaceClient } from '../../../services/workspace-client/cheworkspace/cheWorkspaceClient';
import { IRemoteAPI } from '@eclipse-che/workspace-client';
import { container } from '../../../inversify.config';

describe('Get devfile schema', () => {
  const mockGetDevfileSchema = jest.fn();

  beforeEach(() => {
    class MockCheWorkspaceClient extends CheWorkspaceClient {
      get restApiClient() {
        return {
          getDevfileSchema: async () => mockGetDevfileSchema(),
        } as IRemoteAPI;
      }
    }
    container.rebind(CheWorkspaceClient).to(MockCheWorkspaceClient).inSingletonScope();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

    const mockWorkspaceClient = container.get(CheWorkspaceClient);
    mockGetDevfileSchema.mockResolvedValueOnce(cloneDeep(schemaWithVersionConst));

    const targetSchema = await fetchAndUpdateDevfileSchema(mockWorkspaceClient, '2.0.0');

    expect(targetSchema).toEqual(schemaWithVersionConst);
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

    const mockWorkspaceClient = container.get(CheWorkspaceClient);
    mockGetDevfileSchema.mockResolvedValueOnce(cloneDeep(schemaWithoutVersionConst));

    const targetSchema = await fetchAndUpdateDevfileSchema(mockWorkspaceClient, '2.0.0');

    expect(targetSchema).not.toEqual(schemaWithoutVersionConst);

    expect(targetSchema).toEqual({
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
