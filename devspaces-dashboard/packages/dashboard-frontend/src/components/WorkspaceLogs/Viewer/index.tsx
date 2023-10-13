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

import styles from '@/components/WorkspaceLogs/Viewer/index.module.css';
import { ContainerLogs } from '@/store/Pods/Logs';

const LOGS_CONTAINER_ID = 'output-logs';

export type Props = {
  isExpanded: boolean;
  logsData: ContainerLogs | undefined;
};

export class WorkspaceLogsViewer extends React.PureComponent<Props> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  public componentDidMount(): void {
    window.addEventListener('resize', this.updateScrollTop, false);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateScrollTop);
  }

  updateScrollTop() {
    const objLog = document.getElementById(LOGS_CONTAINER_ID);
    if (objLog && document.activeElement?.id !== LOGS_CONTAINER_ID) {
      objLog.scrollTop = objLog.scrollHeight;
    }
  }

  render() {
    const { logsData } = this.props;

    let logs = '';
    let linesNumber = 0;

    if (logsData && logsData.failure === false) {
      logs = logsData.logs || '';
      linesNumber = logs === '' ? 0 : logs.split('\n').length;
    }

    const expandedStyle = this.props.isExpanded ? styles.expanded : '';

    return (
      <div className={`${styles.viewer} ${expandedStyle}`}>
        <div className={styles.linesCounter}>{linesNumber} lines</div>
        <pre id={LOGS_CONTAINER_ID} tabIndex={0} className={styles.logs}>
          {logs}
        </pre>
      </div>
    );
  }
}
