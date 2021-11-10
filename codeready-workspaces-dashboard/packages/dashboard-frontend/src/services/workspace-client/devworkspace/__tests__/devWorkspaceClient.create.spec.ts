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

import { container } from '../../../../inversify.config';
import { DevWorkspaceBuilder } from '../../../../store/__mocks__/devWorkspaceBuilder';
import { DevWorkspaceClient } from '../devWorkspaceClient';
import * as DwApi from '../../../dashboard-backend-client/devWorkspaceApi';
import devfileApi from '../../../devfileApi';

describe('DevWorkspace client, create', () => {
  let client: DevWorkspaceClient;

  const timestampNew = '2021-10-01T00:00:01.000Z';
  const dateConstructor = window.Date;

  beforeEach(() => {
    client = container.get(DevWorkspaceClient);

    class MockDate extends Date {
      constructor() {
        super(timestampNew);
      }
    }
    window.Date = MockDate as DateConstructor;
  });

  afterEach(() => {
    jest.resetAllMocks();
    window.Date = dateConstructor;
  });

  it('should add annotation of last update time', async () => {
    const namespace = 'che';
    const name = 'wksp-test';
    const testDevfile: devfileApi.Devfile = {
      schemaVersion: '2.1.0',
      metadata: {
        namespace,
        name,
      },
    };
    const testWorkspace = new DevWorkspaceBuilder()
      .withMetadata({
        name,
        namespace,
      })
      .build();

    const spyCreateWorkspace = jest
      .spyOn(DwApi, 'createWorkspace')
      .mockResolvedValueOnce(testWorkspace);
    jest.spyOn(DwApi, 'patchWorkspace').mockResolvedValueOnce(testWorkspace);

    await client.create(testDevfile, namespace, [], undefined, undefined, {});

    expect(spyCreateWorkspace).toBeCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          annotations: {
            'che.eclipse.org/last-updated-timestamp': timestampNew,
          },
        }),
      }),
    );
  });
});
