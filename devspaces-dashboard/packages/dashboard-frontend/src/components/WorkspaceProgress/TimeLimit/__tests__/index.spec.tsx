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

import React from 'react';
import getComponentRenderer from '../../../../services/__mocks__/getComponentRenderer';
import { TimeLimit } from '..';

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnTimeout = jest.fn();

describe('TimeLimit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should render', async () => {
    const timeout = 10;
    renderComponent(timeout);

    jest.advanceTimersByTime((timeout - 1) * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(mockOnTimeout).not.toHaveBeenCalled();

    jest.advanceTimersByTime((timeout + 1) * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(mockOnTimeout).toHaveBeenCalled();
  });
});

function getComponent(timeLimitSec: number) {
  return <TimeLimit timeLimitSec={timeLimitSec} onTimeout={mockOnTimeout} />;
}
