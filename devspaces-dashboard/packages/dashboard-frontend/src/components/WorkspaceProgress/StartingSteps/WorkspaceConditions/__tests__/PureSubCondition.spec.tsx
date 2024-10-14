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

import React from 'react';

import { PureSubCondition } from '@/components/WorkspaceProgress/StartingSteps/WorkspaceConditions/PureSubCondition';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

jest.mock('@/components/WorkspaceProgress/StepTitle');

describe('Starting sub-steps, checking rendering', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot with no title', () => {
    expect(createSnapshot(undefined)).toMatchSnapshot();
  });

  test('snapshot with a title', () => {
    expect(createSnapshot('sub-step test', 1)).toMatchSnapshot();
  });

  it('should show the title and a proper icon(depends on the distance value)', () => {
    let distanceElement: HTMLElement | null;
    let stepTitle: HTMLElement | null;

    const { reRenderComponent } = renderComponent('sub-step test 1', -1);

    distanceElement = screen.queryByTestId('distance');
    expect(distanceElement).not.toBeNull();
    expect(distanceElement).toHaveTextContent('-1');

    stepTitle = screen.queryByTestId('step-title');
    expect(stepTitle).not.toBeNull();
    expect(stepTitle).toHaveTextContent('sub-step test 1');

    reRenderComponent('sub-step test 2', 0);

    distanceElement = screen.queryByTestId('distance');
    expect(distanceElement).not.toBeNull();
    expect(distanceElement).toHaveTextContent('0');

    stepTitle = screen.queryByTestId('step-title');
    expect(stepTitle).not.toBeNull();
    expect(stepTitle).toHaveTextContent('sub-step test 2');

    reRenderComponent('sub-step test 3', 1);

    distanceElement = screen.queryByTestId('distance');
    expect(distanceElement).not.toBeNull();
    expect(distanceElement).toHaveTextContent('1');

    stepTitle = screen.queryByTestId('step-title');
    expect(stepTitle).not.toBeNull();
    expect(stepTitle).toHaveTextContent('sub-step test 3');

    reRenderComponent(undefined, 1);

    distanceElement = screen.queryByTestId('distance');
    expect(distanceElement).toBeNull();

    stepTitle = screen.queryByTestId('step-title');
    expect(stepTitle).toBeNull();
  });
});

function getComponent(title: string | undefined, distance?: -1 | 0 | 1): React.ReactElement {
  return <PureSubCondition title={title} distance={distance} />;
}
