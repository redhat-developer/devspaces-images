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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { V1Pod } from '@kubernetes/client-node';
import userEvent from '@testing-library/user-event';
import React from 'react';

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { NO_CONTAINERS, WorkspaceLogsContainerSelector } from '..';

jest.mock('@/components/ResourceIcon');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnContainerChange = jest.fn();

describe('WorkspaceLogsContainerSelector', () => {
  let pod: V1Pod;

  beforeEach(() => {
    pod = {
      spec: {
        containers: [
          {
            name: 'container1',
          },
          {
            name: 'container2',
          },
        ],
        initContainers: [
          {
            name: 'initContainer1',
          },
          {
            name: 'initContainer2',
          },
        ],
      },
    } as V1Pod;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    expect(createSnapshot(pod)).toMatchSnapshot();
  });

  it('should render component without containers', () => {
    const pod = {
      spec: {},
    } as V1Pod;

    renderComponent(pod);

    expect(screen.queryByRole('button', { name: new RegExp(NO_CONTAINERS) })).not.toBeNull();
  });

  it('should toggle dropdown', async () => {
    renderComponent(pod);

    const dropdown = screen.getByRole('button', { name: /container1/ });
    await userEvent.click(dropdown);

    expect(screen.queryByRole('menu')).not.toBeNull();
    expect(screen.queryByRole('menuitem', { name: /container1/ })).not.toBeNull();
    expect(screen.queryByRole('menuitem', { name: /container2/ })).not.toBeNull();
    expect(screen.queryByRole('menuitem', { name: /initContainer1/ })).not.toBeNull();
    expect(screen.queryByRole('menuitem', { name: /initContainer2/ })).not.toBeNull();
  });

  it('should select the specified container', () => {
    renderComponent(pod);

    expect(screen.queryByRole('button', { name: /container1/ })).not.toBeNull();
    expect(mockOnContainerChange).toHaveBeenLastCalledWith('container1');
  });

  it('should select an init container', async () => {
    renderComponent(pod);

    const dropdown = screen.getByRole('button', { name: /container1/ });
    await userEvent.click(dropdown);

    const initContainer = screen.getByRole('menuitem', { name: /initContainer1/ });
    await userEvent.click(initContainer);

    expect(screen.queryByRole('button', { name: /initContainer1/ })).not.toBeNull();
    expect(mockOnContainerChange).toHaveBeenLastCalledWith('initContainer1');
  });

  it('should select container', async () => {
    renderComponent(pod);

    const dropdown = screen.getByRole('button', { name: /container1/ });
    await userEvent.click(dropdown);

    const container = screen.getByRole('menuitem', { name: /container2/ });
    await userEvent.click(container);

    expect(screen.queryByRole('button', { name: /container2/ })).not.toBeNull();
    expect(mockOnContainerChange).toHaveBeenLastCalledWith('container2');
  });

  it('should select container after re-render', () => {
    const { reRenderComponent } = renderComponent(pod);

    expect(screen.getByRole('button', { name: /container1/ })).not.toBeNull();

    const nextPod = { ...pod };
    nextPod.metadata = nextPod.metadata
      ? { ...nextPod.metadata, name: 'next-pod' }
      : { name: 'next-pod' };
    // remove first container
    nextPod.spec!.containers.shift();
    reRenderComponent(nextPod);

    expect(screen.queryByRole('button', { name: /container1/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /container2/ })).not.toBeNull();
    expect(mockOnContainerChange).toHaveBeenLastCalledWith('container2');
  });
});

function getComponent(pod: V1Pod): React.ReactElement {
  return <WorkspaceLogsContainerSelector pod={pod} onContainerChange={mockOnContainerChange} />;
}
