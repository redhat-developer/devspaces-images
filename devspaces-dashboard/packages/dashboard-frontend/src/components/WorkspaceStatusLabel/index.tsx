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

import { Label } from '@patternfly/react-core';
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InProgressIcon,
  ResourcesFullIcon,
} from '@patternfly/react-icons';
import React from 'react';
import ReactTooltip from 'react-tooltip';

import styles from '@/components/WorkspaceStatusLabel/index.module.css';
import {
  DeprecatedWorkspaceStatus,
  DevWorkspaceStatus,
  WorkspaceStatus,
} from '@/services/helpers/types';

// stopped icon color
const grey = window
  .getComputedStyle(document.body)
  .getPropertyValue('--pf-global--palette--black-500');
export type ColorType = 'blue' | '#0e6fe0' | 'green' | 'orange' | 'red' | 'grey';

export const StoppedIcon = (props: { color?: ColorType }): React.ReactElement => {
  return (
    <svg
      fill={props.color ? props.color : grey}
      height="1em"
      width="1em"
      viewBox="0 0 16 16"
      aria-hidden="true"
      role="img"
      style={{ verticalAlign: '-0.125em' }}
    >
      <path
        d="M8.001,0 C3.589,0 0,3.590 0,8 C0,12.410 3.590,16 8.001,16 C12.412,16 16,12.410
              16,8 C16,3.589 12.4125,0 8.001,0 Z M8,14 C4.690,14 2,11.310 2,8 C2,4.692 4.690,2
              8,2 C11.307,2 14,4.690 14,8 C14,11.309 11.307,14 8,14 Z"
      ></path>
      <path
        d="M8.001,3.5 C5.519,3.5 3.5,5.520 3.5,8 C3.5,10.481 5.520,12.5 8.000,12.5 C10.482,12.5 12.5,10.481
              12.5,8 C12.5,5.519 10.482,3.5 8.000,3.5 Z M8,10.75 C6.483,10.75 5.25,9.517 5.25,8 C5.25,6.484
              6.483,5.25 8,5.25 C9.516,5.25 10.75,6.483 10.75,8 C10.75,9.516 9.516,10.75 8,10.75 Z"
      ></path>
    </svg>
  );
};

type Props = {
  status: WorkspaceStatus | DevWorkspaceStatus | DeprecatedWorkspaceStatus;
};

class WorkspaceStatusLabel extends React.PureComponent<Props> {
  render(): React.ReactElement {
    const { status } = this.props;

    let color: ColorType;

    const tooltip = (
      <ReactTooltip
        getContent={() => (status === 'Deprecated' ? 'Deprecated workspace' : status)}
        backgroundColor="black"
        textColor="white"
        effect="solid"
      />
    );

    switch (status) {
      case WorkspaceStatus.STOPPED:
      case DevWorkspaceStatus.STOPPED:
        color = 'grey';
        return (
          <>
            <Label
              data-tip=""
              className={`${styles.statusLabel} ${styles.stoppedLabel}`}
              color={color}
              icon={<StoppedIcon />}
            >
              Stopped
            </Label>
            {tooltip}
          </>
        );
      case WorkspaceStatus.RUNNING:
      case DevWorkspaceStatus.RUNNING:
        color = 'green';
        return (
          <>
            <Label
              data-tip=""
              className={styles.statusLabel}
              color={color}
              icon={<ResourcesFullIcon />}
            >
              Running
            </Label>
            {tooltip}
          </>
        );
      case DevWorkspaceStatus.FAILING:
        color = 'red';
        return (
          <>
            <Label
              data-tip=""
              className={styles.statusLabel}
              color={color}
              icon={<InProgressIcon className={styles.rotate} />}
            >
              Failing
            </Label>
            {tooltip}
          </>
        );
      case WorkspaceStatus.ERROR:
        color = 'red';
        return (
          <>
            <Label
              data-tip=""
              className={styles.statusLabel}
              color={color}
              icon={<ExclamationCircleIcon />}
            >
              Error
            </Label>
            {tooltip}
          </>
        );
      case DevWorkspaceStatus.FAILED:
        color = 'red';
        return (
          <>
            <Label
              data-tip=""
              className={styles.statusLabel}
              color={color}
              icon={<ExclamationCircleIcon />}
            >
              Failed
            </Label>
            {tooltip}
          </>
        );
      case WorkspaceStatus.STARTING:
      case DevWorkspaceStatus.STARTING:
        color = 'blue';
        return (
          <>
            <Label
              data-tip=""
              className={styles.statusLabel}
              color={color}
              icon={<InProgressIcon className={styles.rotate} />}
            >
              Starting
            </Label>
            {tooltip}
          </>
        );
      case 'Deprecated':
        return (
          <>
            <Label
              data-tip=""
              className={styles.statusLabel}
              color="orange"
              icon={<ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />}
            >
              Deprecated
            </Label>
            {tooltip}
          </>
        );
      default:
        color = 'grey';
        return (
          <>
            <Label
              data-tip=""
              className={styles.statusLabel}
              color={color}
              icon={<InProgressIcon className={styles.rotate} />}
            >
              {`${status}`.toLocaleLowerCase()}
            </Label>
            {tooltip}
          </>
        );
    }
  }
}

export default WorkspaceStatusLabel;
