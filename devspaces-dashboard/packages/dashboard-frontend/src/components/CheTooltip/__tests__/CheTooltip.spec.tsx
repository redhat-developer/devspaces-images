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

import { TooltipPosition } from '@patternfly/react-core';
import React from 'react';

import { CheTooltip, Props } from '@/components/CheTooltip';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

// use actual CheTooltip component
jest.unmock('@/components/CheTooltip');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('CheTooltip component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const props = {
      content: <span>Tooltip text.</span>,
    };

    const snapshot = createSnapshot(props);

    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('passed props', () => {
    const props: Props = {
      position: TooltipPosition.right,
      exitDelay: 500,
      content: <span>Tooltip text.</span>,
    };

    renderComponent(props);

    const tooltipProps = screen.getByTestId('tooltip-props');
    expect(tooltipProps).toHaveTextContent(
      '{"isContentLeftAligned":true,"style":{"border":"1px solid","borderRadius":"3px","opacity":"0.9"},"position":"right","exitDelay":500}',
    );

    const tooltipContent = screen.getByTestId('tooltip-content');
    expect(tooltipContent).toHaveTextContent('Tooltip text.');

    const tooltipPlacedTo = screen.getByTestId('tooltip-placed-to');
    expect(tooltipPlacedTo).toHaveTextContent('some text');

    screen.debug();
  });
});

function getComponent(props: Props): React.ReactElement {
  return (
    <CheTooltip {...props}>
      <div>some text</div>
    </CheTooltip>
  );
}
