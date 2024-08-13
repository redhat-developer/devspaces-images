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

import { SliderProps } from '@patternfly/react-core';
import { fireEvent, screen } from '@testing-library/react';
import React from 'react';

import {
  MemoryLimitField,
  STEP,
} from '@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions/MemoryLimitField';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

jest.mock('@patternfly/react-core', () => {
  return {
    ...jest.requireActual('@patternfly/react-core'),
    Slider: (obj: SliderProps) => (
      <input
        type="range"
        data-testid={obj['data-testid']}
        value={obj.value}
        onChange={event => {
          if (obj.onChange) {
            obj.onChange(event.target.value ? parseInt(event.target.value) : 0);
          }
        }}
      />
    ),
  };
});

const mockOnChange = jest.fn();

describe('MemoryLimitField', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('8Gi snapshot', () => {
    const snapshot = createSnapshot(8);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should be init with 8Gi and switched to 32Gi', () => {
    renderComponent(8 * STEP);
    const slider = screen.getByTestId('memory-limit-slider') as HTMLInputElement;
    const getVal = () => parseInt(slider.value);

    expect(slider).toBeDefined();
    expect(getVal()).toEqual(8);

    fireEvent.change(slider, { target: { value: 32 } });

    expect(getVal()).toEqual(32);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });
});

function getComponent(memoryLimit: number) {
  return <MemoryLimitField memoryLimit={memoryLimit} onChange={mockOnChange} />;
}
