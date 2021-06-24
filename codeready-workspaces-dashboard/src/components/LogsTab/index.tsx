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

import { FileIcon } from '@patternfly/react-icons';
import {
  Title,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  PageSection,
  PageSectionVariants
} from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { WorkspaceStatus } from '../../services/helpers/types';
import LogsTools from './LogsTools';
import { AppState } from '../../store';
import { selectAllWorkspaces, selectLogs } from '../../store/Workspaces/selectors';

import styles from './index.module.css';

const maxLogLength = 200;
const errorRe = /^Error: /gi;

type Props =
  { workspaceId: string }
  & MappedProps;

type State = {
  isExpanded: boolean;
  isStopped: boolean;
  hasError: boolean;
  logs: string[] | undefined;
};

export class LogsTab extends React.PureComponent<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
      isStopped: true,
      hasError: false,
      logs: [],
    };
  }

  public componentDidMount(): void {
    this.updateLogsData();
  }

  public componentDidUpdate(): void {
    this.updateLogsData();
  }

  private updateLogsData() {
    const { workspaceId, workspacesLogs, allWorkspaces } = this.props;
    if (allWorkspaces && allWorkspaces.length > 0) {

      const workspace = allWorkspaces.find(workspace => workspace.id === workspaceId);
      if (!workspace) {
        return;
      }

      const hasError = workspace.status && WorkspaceStatus[workspace.status] === WorkspaceStatus.ERROR;
      if (hasError && !this.state.hasError) {
        this.setState({ hasError });
      }

      const isStopped = workspace.status !== undefined && WorkspaceStatus[workspace.status] === WorkspaceStatus.STOPPED;
      if (this.state.isStopped !== isStopped) {
        this.setState({ isStopped });
      }

      const logs = workspacesLogs.get(workspaceId);
      // it's comparing of internal references of two objects
      if (this.state.logs !== logs) {
        this.setState({ logs });
      }
    }
  }

  private get terminal(): React.ReactElement {
    let logs = this.state.logs;
    if (!logs) {
      logs = [];
    } else if (logs.length > maxLogLength) {
      logs.splice(0, maxLogLength);
    }

    return (
      <div className={styles.consoleOutput}>
        <div>{logs.length} lines</div>
        <pre>{logs.map((item: string, i: number) => {
          if (errorRe.test(item)) {
            return (
              <p className={styles.errorColor} key={item + i}>
                {item.replace(errorRe, '')}
              </p>
            );
          }
          return (<p key={item + i}>{item}</p>);
        })}</pre>
      </div>);
  }

  render() {
    const { isExpanded, hasError, isStopped, logs } = this.state;

    if (isStopped && !hasError) {
      return (
        <EmptyState style={{ backgroundColor: '#f1f1f1' }}>
          <EmptyStateIcon icon={FileIcon} />
          <Title headingLevel="h4" size="lg">
            No Logs to display
          </Title>
          <EmptyStateBody>
            Logs will be displayed in a running workspace.
          </EmptyStateBody>
        </EmptyState>
      );
    }

    return (
      <PageSection variant={PageSectionVariants.light}>
        <div className={isExpanded ? styles.tabExpanded : ''}>
          <LogsTools logs={logs ? logs : []} handleExpand={isExpanded => {
            this.setState({ isExpanded });
          }} />
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
export default connector(LogsTab);
