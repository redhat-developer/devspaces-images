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

import mockAxios from 'axios';

import { container } from '@/inversify.config';
import { DevWorkspaceClient } from '@/services/workspace-client/devworkspace/devWorkspaceClient';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

describe('DevWorkspace client', () => {
  let client: DevWorkspaceClient;

  beforeEach(() => {
    mockAxios.get = jest.fn();
    client = container.get(DevWorkspaceClient);
  });

  it('should check for devworkspace error', () => {
    const devWorkspace1 = new DevWorkspaceBuilder()
      .withId('id-wksp-test')
      .withName('wksp-test')
      .withNamespace('test')
      .withStatus({
        phase: 'RUNNING',
      })
      .build();
    expect(() => client.checkForDevWorkspaceError(devWorkspace1)).not.toThrow();

    const devWorkspace2 = new DevWorkspaceBuilder()
      .withId('id-wksp-test')
      .withName('wksp-test')
      .withNamespace('test')
      .withStatus({
        phase: 'FAILED',
      })
      .build();
    expect(() => client.checkForDevWorkspaceError(devWorkspace2)).toThrowError(
      new Error('Unknown error occurred when trying to process the devworkspace'),
    );

    const devWorkspace3 = new DevWorkspaceBuilder()
      .withId('id-wksp-test')
      .withName('wksp-test')
      .withNamespace('test')
      .withStatus({
        phase: 'FAILED',
        message: 'failure reason if any',
      })
      .build();
    expect(() => client.checkForDevWorkspaceError(devWorkspace3)).toThrowError(
      new Error('failure reason if any'),
    );
  });

  it('should fetch all devworkspaces', async () => {
    const items = [
      new DevWorkspaceBuilder().withId('id-wksp-1').build(),
      new DevWorkspaceBuilder().withId('id-wksp-2').build(),
      new DevWorkspaceBuilder().withId('id-wksp-3').build(),
      new DevWorkspaceBuilder()
        .withMetadata({
          labels: {
            'console.openshift.io/terminal': 'true',
          },
          name: 'wksp-4',
          namespace: 'test',
          uid: 'id-wksp-4',
        })
        .build(),
    ];
    (mockAxios.get as jest.Mock).mockResolvedValueOnce(
      new Promise(resolve =>
        resolve({
          data: {
            items,
            metadata: {
              resourceVersion: 'test',
            },
          },
        }),
      ),
    );
    const { workspaces } = await client.getAllWorkspaces('test');
    expect(workspaces.length).toEqual(3);
  });

  it('should get devworkspace by name', async () => {
    const namespace = 'test';
    const name = 'wksp-test';
    const workspaceNotReady = new DevWorkspaceBuilder()
      .withName(name)
      .withNamespace(namespace)
      .build();
    (mockAxios.get as jest.Mock).mockResolvedValueOnce(
      new Promise(resolve =>
        resolve({
          data: workspaceNotReady,
        }),
      ),
    );
    const workspaceReady = new DevWorkspaceBuilder()
      .withName(name)
      .withNamespace(namespace)
      .withStatus({
        phase: 'RUNNING',
        mainUrl: 'main_url',
      })
      .build();
    (mockAxios.get as jest.Mock).mockResolvedValueOnce(
      new Promise(resolve =>
        resolve({
          data: workspaceReady,
        }),
      ),
    );
    const newWorkspace = await client.getWorkspaceByName(namespace, name);
    expect(newWorkspace).toEqual(workspaceReady);
  });
});
