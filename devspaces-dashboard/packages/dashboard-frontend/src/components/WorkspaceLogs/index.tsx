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
import { FileIcon } from '@patternfly/react-icons';
import {
  Title,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  PageSection,
  PageSectionVariants,
} from '@patternfly/react-core';
import { isEqual } from 'lodash';
import { connect, ConnectedProps } from 'react-redux';
import WorkspaceLogsTools from './Tools';
import { AppState } from '../../store';
import { selectAllWorkspaces, selectLogs } from '../../store/Workspaces/selectors';

import styles from './index.module.css';

const MAX_LOG_LENGTH = 500;
const OUTPUT_LOG_ID = 'output-logs';
const cheErrorRe = /^Error: /i;
const dwErrorRe = /^[1-9]{0,5} error occurred:/i;

export type Props = {
  workspaceUID: string | undefined;
  isDevWorkspace: boolean | undefined;
} & MappedProps;

export type State = {
  isExpanded: boolean;
  isStopped: boolean;
  hasError: boolean;
  logs: string[] | undefined;
};

export class WorkspaceLogs extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
      isStopped: true,
      hasError: false,
      logs: [],
    };
  }

  private get errorRe(): RegExp {
    if (this.props.isDevWorkspace) {
      return dwErrorRe;
    }
    return cheErrorRe;
  }

  public componentDidMount(): void {
    window.addEventListener('resize', this.updateScrollTop, false);
    this.updateLogsData();
    this.updateScrollTop();
  }

  public componentDidUpdate(): void {
    this.updateLogsData();
    this.updateScrollTop();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateScrollTop);
  }

  updateScrollTop() {
    const objLog = document.getElementById(OUTPUT_LOG_ID);
    if (objLog && document.activeElement?.id !== OUTPUT_LOG_ID) {
      objLog.scrollTop = objLog.scrollHeight;
    }
  }

  private updateLogsData() {
    const { workspaceUID, workspacesLogs, allWorkspaces } = this.props;

    if (workspaceUID === undefined || allWorkspaces.length === 0) {
      return;
    }

    const workspace = allWorkspaces.find(w => w.uid === workspaceUID);
    if (!workspace) {
      return;
    }

    const logs = workspacesLogs.get(workspaceUID);
    const isStopped = workspace.isStopped;
    if (this.state.isStopped !== isStopped || !isEqual(this.state.logs, logs)) {
      this.setState({
        isStopped,
        logs,
      });
    }
  }

  private getLines(): JSX.Element[] {
    let logs = this.state.logs || [];
    if (logs.length > MAX_LOG_LENGTH) {
      logs = logs.slice(logs.length - MAX_LOG_LENGTH);
    }

    const createLine = (text: string, key: number, isError = false): React.ReactElement => {
      return (
        <p className={isError ? styles.errorColor : ''} key={`output_error_${key}`}>
          {text.trim()}
        </p>
      );
    };

    return logs.map((item: string, index: number) => {
      if (this.errorRe.test(item)) {
        const errorMessage = item.replace(this.errorRe, '');
        return createLine(errorMessage, index, true);
      }
      return createLine(item, index);
    });
  }

  private get terminal(): React.ReactElement {
    const lines = this.getLines();

    return (
      <div className={styles.consoleOutput}>
        <div>{lines.length} lines</div>
        <pre id={OUTPUT_LOG_ID} tabIndex={0}>
          {lines}
        </pre>
      </div>
    );
  }

  render() {
    const { isExpanded, isStopped, logs } = this.state;
    const shouldToggleNavbar = this.props.isDevWorkspace === false;

    if (isStopped) {
      return (
        <EmptyState style={{ backgroundColor: '#f1f1f1' }}>
          <EmptyStateIcon icon={FileIcon} />
          <Title headingLevel="h4" size="lg">
            No Logs to display
          </Title>
          <EmptyStateBody>Logs will be displayed in a running workspace.</EmptyStateBody>
        </EmptyState>
      );
    }

    return (
      <PageSection variant={PageSectionVariants.light}>
        <div className={isExpanded ? styles.tabExpanded : ''}>
          <WorkspaceLogsTools
            logs={logs ? logs : []}
            shouldToggleNavbar={shouldToggleNavbar}
            handleExpand={isExpanded => {
              this.setState({ isExpanded });
            }}
          />
          {this.terminal}
        </div>
      </PageSection>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  workspacesLogs: selectLogs(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(WorkspaceLogs);
