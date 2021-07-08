/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import { Flex, FlexItem, Button, Divider } from '@patternfly/react-core';
import { CompressIcon, DownloadIcon, ExpandIcon } from '@patternfly/react-icons/dist/js/icons';
import { getBlobUrl } from '../../../services/helpers/tools';

import styles from './index.module.css';

type Props = {
  logs: string[] | undefined;
  handleExpand: (isExpand: boolean) => void;
};

type State = {
  isExpanded: boolean;
};

class LogsTools extends React.PureComponent<Props, State> {
  private readonly handleExpand: () => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
    };

    this.handleExpand = () => {
      if (this.state.isExpanded) {
        window.postMessage('show-navbar', '*');
        const isExpanded = false;
        this.setState({ isExpanded });
        this.props.handleExpand(isExpanded);
      } else {
        window.postMessage('hide-navbar', '*');
        const isExpanded = true;
        this.setState({ isExpanded });
        this.props.handleExpand(isExpanded);
      }
    };
  }

  public render(): React.ReactElement {
    const { logs } = this.props;
    const logsText = logs ? logs.join('\n') : '';
    const logsBlobUrl = getBlobUrl(logsText);

    return (
      <div className={styles.logsTools}>
        <Flex>
          <FlexItem>
            <a download="logs.txt" href={logsBlobUrl}><DownloadIcon />Download</a>
          </FlexItem>
          <Divider isVertical />
          <FlexItem>
            <Button variant="link" onClick={() => this.handleExpand()}>
              {this.state.isExpanded ? (
                <React.Fragment><CompressIcon />Compress</React.Fragment>
              ) : (
                  <React.Fragment><ExpandIcon />Expand</React.Fragment>
                )}
            </Button>
          </FlexItem>
        </Flex>
      </div>
    );
  }
}

export default LogsTools;
