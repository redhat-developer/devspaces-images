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
  PageSectionVariants,
} from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import LogsTools from './LogsTools';
import { AppState } from '../../store';
import { selectAllWorkspaces, selectLogs } from '../../store/Workspaces/selectors';
import { isEqual } from 'lodash';

import styles from './index.module.css';

const maxLogLength = 200;

type Props = {
  workspaceId: string;
  isDevWorkspace: boolean;
} & MappedProps;

type State = {
  isExpanded: boolean;
  isStopped: boolean;
  hasError: boolean;
  logs: string[] | undefined;
};

export class LogsTab extends React.PureComponent<Props, State> {
  private readonly errorRe: RegExp;

  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
      isStopped: true,
      hasError: false,
      logs: [],
    };

    this.errorRe = props.isDevWorkspace ? /^[1-9]{0,5} error occurred:/i : /^Error: /i;
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

      const logs = workspacesLogs.get(workspaceId);
      const isStopped = workspace.isStopped;
      if (this.state.isStopped !== isStopped || !isEqual(this.state.logs, logs)) {
        this.setState({
          isStopped,
          logs,
        });
      }
    }
  }

  private getLines(): JSX.Element[] {
    const logs = this.state.logs || [];
    if (logs.length > maxLogLength) {
      logs.splice(0, logs.length - maxLogLength);
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
        <pre>{lines}</pre>
      </div>
    );
  }

  render() {
    const { isExpanded, isStopped, logs } = this.state;

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
          <LogsTools
            logs={logs ? logs : []}
            preventPostMessage={this.props.isDevWorkspace}
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
export default connector(LogsTab);
