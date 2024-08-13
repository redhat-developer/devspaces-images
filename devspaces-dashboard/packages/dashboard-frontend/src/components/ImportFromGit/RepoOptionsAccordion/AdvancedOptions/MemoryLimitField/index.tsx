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

import { FormGroup, Slider } from '@patternfly/react-core';
import React from 'react';

import { formatBytes } from '@/components/ImportFromGit/helpers';

export const STEP = 1073741824;

const steps = [
  { value: 0, label: 'default' },
  { value: 1, label: '1', isLabelHidden: true },
  { value: 2, label: '2', isLabelHidden: true },
  { value: 3, label: '4', isLabelHidden: true },
  { value: 4, label: '4' },
  { value: 6, label: '6', isLabelHidden: true },
  { value: 8, label: '8', isLabelHidden: true },
  { value: 12, label: '12', isLabelHidden: true },
  { value: 16, label: '16' },
  { value: 20, label: '20', isLabelHidden: true },
  { value: 24, label: '24', isLabelHidden: true },
  { value: 28, label: '28', isLabelHidden: true },
  { value: 32, label: '32' },
];

export type Props = {
  onChange: (memoryLimit: number) => void;
  memoryLimit: number;
};
export type State = {
  memoryLimit: number;
};

export class MemoryLimitField extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const memoryLimit = this.getMemoryLimit();

    this.state = {
      memoryLimit,
    };
  }

  public componentDidUpdate(prevProps: Readonly<Props>): void {
    if (prevProps.memoryLimit !== this.props.memoryLimit) {
      const memoryLimit = this.getMemoryLimit();
      if (memoryLimit !== this.state.memoryLimit) {
        this.setState({ memoryLimit });
      }
    }
  }

  private handleChange(memoryLimit: number) {
    if (memoryLimit !== this.state.memoryLimit) {
      this.setState({ memoryLimit });
      this.props.onChange(memoryLimit * STEP);
    }
  }

  private getMemoryLimit(): number {
    const memoryLimit = this.props.memoryLimit;
    if (memoryLimit <= STEP) {
      return 0;
    }
    return memoryLimit / STEP;
  }

  private getLabel(memoryLimit: number): string {
    if (memoryLimit > 0) {
      return `Memory Limit (${formatBytes(memoryLimit * STEP)})`;
    }

    return 'Memory Limit';
  }

  public render() {
    const memoryLimit = this.state.memoryLimit;
    const label = this.getLabel(memoryLimit);

    return (
      <FormGroup label={label}>
        <Slider
          data-testid="memory-limit-slider"
          value={memoryLimit}
          onChange={value => this.handleChange(value)}
          max={steps[steps.length - 1].value}
          customSteps={steps}
        />
      </FormGroup>
    );
  }
}
