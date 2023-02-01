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
import { Progress, ProgressMeasureLocation, ProgressSize } from '@patternfly/react-core';

import styles from './index.module.css';

type Props = {
  isLoading: boolean;
};

type State = {
  progressVal: number;
};

class ProgressIndicator extends React.PureComponent<Props, State> {
  private intervalId: any;
  private readonly onProgressInc: () => void;

  constructor(props: Props) {
    super(props);

    this.state = { progressVal: 0 };

    this.onProgressInc = (): void => {
      const progressVal = this.state.progressVal < 100 ? this.state.progressVal + 5 : 0;
      this.setState({ progressVal });
    };
  }

  private updateProgressInterval(): void {
    if (this.props.isLoading) {
      if (!this.intervalId) {
        this.intervalId = setInterval(() => {
          if (!this.props.isLoading && this.state.progressVal === 0) {
            if (this.intervalId) {
              clearInterval(this.intervalId);
              this.intervalId = undefined;
            }
            return;
          }
          this.onProgressInc();
        }, 20);
      }
    }
  }

  // This method is called when the component is first added to the document
  public componentDidMount(): void {
    this.updateProgressInterval();
  }

  // This method is called when the route parameters change
  public componentDidUpdate(): void {
    this.updateProgressInterval();
  }

  public componentWillUnmount(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  public render(): React.ReactElement {
    const { progressVal } = this.state;

    return (
      <span className={styles.progressLine}>
        {this.props.isLoading || this.state.progressVal !== 0 ? (
          <Progress
            id="progress-indicator"
            value={progressVal}
            size={ProgressSize.sm}
            measureLocation={ProgressMeasureLocation.none}
            aria-label="Action is in progress"
          />
        ) : (
          ''
        )}
      </span>
    );
  }
}

export default ProgressIndicator;
