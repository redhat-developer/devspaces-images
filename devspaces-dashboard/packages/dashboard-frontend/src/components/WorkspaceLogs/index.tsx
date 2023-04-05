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

import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  PageSection,
  PageSectionVariants,
  Title,
} from '@patternfly/react-core';
import { FileIcon } from '@patternfly/react-icons';
import { isEqual } from 'lodash';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Workspace } from '../../services/workspace-adapter';
import { AppState } from '../../store';
import { selectAllWorkspaces } from '../../store/Workspaces/selectors';
import WorkspaceLogsTools from './Tools';

import styles from './index.module.css';
import { DevWorkspaceStatus } from '../../services/helpers/types';

const MAX_LOG_LENGTH = 500;
const LOGS_CONTAINER_ID = 'output-logs';
const ERROR_REGEX = /^[1-9]{0,5} error occurred:/i;

export type Props = {
  workspaceUID: string | undefined;
} & MappedProps;

export type State = {
  isExpanded: boolean;
  isStarting: boolean;
  isFailed: boolean;
  logs: string[];
};

export class WorkspaceLogs extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
      isStarting: false,
      isFailed: false,
      logs: [],
    };
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
    const objLog = document.getElementById(LOGS_CONTAINER_ID);
    if (objLog && document.activeElement?.id !== LOGS_CONTAINER_ID) {
      objLog.scrollTop = objLog.scrollHeight;
    }
  }

  private findWorkspace(
    uid: string | undefined,
    allWorkspaces: Workspace[],
  ): Workspace | undefined {
    if (uid === undefined) {
      return;
    }
    return allWorkspaces.find(w => w.uid === uid);
  }

  private updateLogsData() {
    const { workspaceUID } = this.props;

    const workspace = this.findWorkspace(workspaceUID, this.props.allWorkspaces);

    if (workspace === undefined) {
      return;
    }

    const logs = workspace.logs || [];
    const isStarting = workspace.isStarting || false;
    if (this.state.isStarting !== isStarting || !isEqual(this.state.logs, logs)) {
      this.setState({
        isStarting,
        logs,
      });
    }

    const isFailed = workspace.status === DevWorkspaceStatus.FAILED;
    this.setState({
      isFailed,
    });
  }

  private getLines(): JSX.Element[] {
    let logs = this.state.logs || [];
    if (logs.length > MAX_LOG_LENGTH) {
      logs = logs.slice(logs.length - MAX_LOG_LENGTH);
    }

    const createLine = (text: string): React.ReactElement => {
      const isError = ERROR_REGEX.test(text);
      const message = isError ? text.trimStart().replace(ERROR_REGEX, '').trimEnd() : text.trim();
      return (
        <p
          className={isError ? styles.errorColor : ''}
          key={message}
          data-testid="workspace-logs-line"
        >
          {message}
        </p>
      );
    };

    return logs.map((item: string) => {
      return createLine(item);
    });
  }

  private get terminal(): React.ReactElement {
    const lines = this.getLines();
    return (
      <div className={styles.consoleOutput}>
        <div>{lines.length} lines</div>
        <pre id={LOGS_CONTAINER_ID} tabIndex={0}>
          {lines}
        </pre>
      </div>
    );
  }

  render() {
    const { isExpanded, isStarting, isFailed, logs } = this.state;
    const shouldToggleNavbar = true;

    if (isStarting === false && isFailed == false) {
      return (
        <EmptyState>
          <EmptyStateIcon icon={FileIcon} />
          <Title headingLevel="h4" size="lg">
            No Logs to show
          </Title>
          <EmptyStateBody>Logs will be shown for a starting workspace.</EmptyStateBody>
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
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(WorkspaceLogs);
