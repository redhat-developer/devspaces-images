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

import { container } from '../../../../inversify.config';
import { DevWorkspaceBuilder } from '../../../../store/__mocks__/devWorkspaceBuilder';
import { DevWorkspaceClient } from '../devWorkspaceClient';
import * as DwApi from '../../../dashboard-backend-client/devWorkspaceApi';

describe('DevWorkspace client, changeWorkspaceStatus', () => {
  let client: DevWorkspaceClient;

  const timestampOld = '2021-09-01T00:00:01.000Z';
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
    jest.restoreAllMocks();
    window.Date = dateConstructor;
  });

  it('should add annotation of last update time', async () => {
    const testWorkspace = new DevWorkspaceBuilder()
      .withName('wksp-test')
      .withStatus({
        phase: 'RUNNING',
        mainUrl: 'link/ide',
      })
      .build();

    const spyPatchWorkspace = jest
      .spyOn(DwApi, 'patchWorkspace')
      .mockResolvedValueOnce({ devWorkspace: testWorkspace, headers: {} });

    jest.spyOn(DwApi, 'getWorkspaceByName').mockResolvedValueOnce(testWorkspace);

    await client.changeWorkspaceStatus(testWorkspace, true);

    expect(spyPatchWorkspace).toBeCalledWith(
      expect.any(String),
      expect.any(String),
      expect.arrayContaining([
        {
          op: 'add',
          path: '/metadata/annotations/che.eclipse.org~1last-updated-timestamp',
          value: timestampNew,
        },
      ]),
    );
  });

  it('should replace annotation of last update time', async () => {
    const testWorkspace = new DevWorkspaceBuilder()
      .withName('wksp-test')
      .withMetadata({
        annotations: {
          'che.eclipse.org/last-updated-timestamp': timestampOld,
        },
      })
      .withStatus({
        phase: 'RUNNING',
        mainUrl: 'link/ide',
      })
      .build();

    const spyPatchWorkspace = jest
      .spyOn(DwApi, 'patchWorkspace')
      .mockResolvedValueOnce({ devWorkspace: testWorkspace, headers: {} });

    jest.spyOn(DwApi, 'getWorkspaceByName').mockResolvedValueOnce(testWorkspace);

    await client.changeWorkspaceStatus(testWorkspace, true);

    expect(spyPatchWorkspace).toBeCalledWith(
      expect.any(String),
      expect.any(String),
      expect.arrayContaining([
        {
          op: 'replace',
          path: '/metadata/annotations/che.eclipse.org~1last-updated-timestamp',
          value: timestampNew,
        },
      ]),
    );
  });

  it('should not add/replace annotation of last update time while stopping workspace', async () => {
    const testWorkspace = new DevWorkspaceBuilder()
      .withName('wksp-test')
      .withStatus({
        phase: 'RUNNING',
        mainUrl: 'link/ide',
      })
      .build();

    const spyPatchWorkspace = jest
      .spyOn(DwApi, 'patchWorkspace')
      .mockResolvedValueOnce({ devWorkspace: testWorkspace, headers: {} });

    jest.spyOn(DwApi, 'getWorkspaceByName').mockResolvedValueOnce(testWorkspace);

    await client.changeWorkspaceStatus(testWorkspace, false);

    expect(spyPatchWorkspace).toBeCalledWith(
      expect.any(String),
      expect.any(String),
      expect.not.arrayContaining([
        {
          path: '/metadata/annotations/che.eclipse.org~1last-updated-timestamp',
        },
      ]),
    );
  });
});
