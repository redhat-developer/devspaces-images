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

import { Switch, Text, Tooltip, TooltipPosition } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { AppState } from '@/store';
import { selectBranding } from '@/store/Branding/selectors';

export type Props = MappedProps & {
  isTemporary: boolean;
  onChange: (isTemporary: boolean) => void;
};
type State = {
  isChecked: boolean;
};

class TemporaryStorageSwitch extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isChecked: this.props.isTemporary,
    };
  }

  private handleChange(isChecked: boolean): void {
    this.setState({ isChecked });
    this.props.onChange(isChecked);
  }

  render(): React.ReactElement {
    const storageTypesDocLink = this.props.branding.docs.storageTypes;
    const isChecked = this.state.isChecked;

    return (
      <React.Fragment>
        <Switch
          id="temporary-storage-switch"
          label="Temporary Storage On"
          labelOff="Temporary Storage Off"
          isChecked={isChecked}
          onChange={isChecked => this.handleChange(isChecked)}
          aria-describedby="temporary-storage-tooltip"
        />
        <span style={{ marginLeft: '10px' }}>
          <Tooltip
            id="temporary-storage-tooltip"
            isContentLeftAligned={true}
            position={TooltipPosition.top}
            content={
              <React.Fragment>
                Temporary Storage allows for faster I/O but may have limited storage and is not
                persistent.
                <Text>
                  <a rel="noreferrer" target="_blank" href={storageTypesDocLink}>
                    Open documentation page
                  </a>
                </Text>
              </React.Fragment>
            }
          >
            <OutlinedQuestionCircleIcon />
          </Tooltip>
        </span>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  branding: selectBranding(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;

export default connector(TemporaryStorageSwitch);
