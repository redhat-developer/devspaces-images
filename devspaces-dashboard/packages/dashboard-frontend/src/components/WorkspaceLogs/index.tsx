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

import { V1Pod } from '@kubernetes/client-node';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  PageSection,
  Title,
} from '@patternfly/react-core';
import { FileIcon } from '@patternfly/react-icons';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Workspace } from '../../services/workspace-adapter';
import { AppState } from '../../store';
import * as LogsStore from '../../store/Pods/Logs';
import { selectPodLogs } from '../../store/Pods/Logs/selectors';
import { selectAllPods } from '../../store/Pods/selectors';
import { selectAllWorkspaces } from '../../store/Workspaces/selectors';
import { WorkspaceLogsContainerSelector } from './ContainerSelector';
import styles from './index.module.css';
import { WorkspaceLogsToolsPanel } from './ToolsPanel';
import { WorkspaceLogsViewer } from './Viewer';
import { WorkspaceLogsViewerTools } from './ViewerTools';

export type Props = {
  workspaceUID: string | undefined;
} & MappedProps;

export type State = {
  isExpanded: boolean;
  containers: string[];
  containerName?: string;
  pod: V1Pod | undefined;
  watchLogs: boolean;
};

export class WorkspaceLogs extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
      containers: [],
      pod: this.findPod(props),
      watchLogs: false,
    };
  }

  public componentDidMount(): void {
    const pod = this.findPod(this.props);
    if (pod !== undefined) {
      this.startWatchingLogs(pod);
    }
  }

  public componentDidUpdate(prevProps: Props): void {
    const pod = this.findPod(this.props);
    const podName = pod?.metadata?.name;
    const containers = pod?.spec?.containers?.map(c => c.name) || [];
    const initContainers = pod?.spec?.initContainers?.map(c => c.name) || [];

    const prevPod = this.findPod(prevProps);
    const prevPodName = prevPod?.metadata?.name;
    const prevContainers = prevPod?.spec?.containers?.map(c => c.name) || [];
    const prevInitContainers = prevPod?.spec?.initContainers?.map(c => c.name) || [];

    if (
      podName !== prevPodName ||
      containers.toString() !== prevContainers.toString() ||
      initContainers.toString() !== prevInitContainers.toString()
    ) {
      this.setState({ pod });
    }

    if (pod !== undefined && this.state.watchLogs === false) {
      this.startWatchingLogs(pod);
    }
    if (pod === undefined && this.state.watchLogs === true) {
      if (prevPod !== undefined) {
        this.stopWatchingLogs(prevPod);
      }
    }
  }

  public componentWillUnmount(): void {
    const pod = this.findPod(this.props);
    if (pod !== undefined) {
      this.stopWatchingLogs(pod);
    }
  }

  private async startWatchingLogs(pod: V1Pod): Promise<void> {
    this.setState({ watchLogs: true });
    await this.props.watchPodLogs(pod);
  }

  private async stopWatchingLogs(pod: V1Pod): Promise<void> {
    this.setState({ watchLogs: false });
    await this.props.stopWatchingPodLogs(pod);
  }

  private findWorkspace(props: Props): Workspace | undefined {
    if (props.workspaceUID === undefined) {
      return;
    }
    return this.props.allWorkspaces.find(w => w.uid === props.workspaceUID);
  }

  private findPod(props: Props): V1Pod | undefined {
    const workspace = this.findWorkspace(props);
    if (workspace === undefined) {
      return;
    }
    return props.allPods.find(pod => pod.metadata?.name?.includes(workspace.id));
  }

  private handleContainerNameChange(containerName: string) {
    this.setState({ containerName });
  }

  private getContainerLogs(props: Props, state: State): LogsStore.ContainerLogs | undefined {
    const { pod, containerName } = state;
    if (pod === undefined || containerName === undefined) {
      return;
    }
    const podName = pod.metadata?.name;
    const logs = props.podLogsFn(podName);
    if (logs === undefined) {
      return;
    }
    const containerLogs = logs[containerName];
    if (containerLogs === undefined) {
      return;
    }
    return containerLogs;
  }

  private showEmptyState() {
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

  private handleExpansionToggle(isExpanded: boolean): void {
    this.setState({ isExpanded });
  }

  private handleDownload(): void {
    const { containerName } = this.state;
    const workspace = this.findWorkspace(this.props);

    const containerLogs = this.getContainerLogs(this.props, this.state);
    const logs = containerLogs?.logs || '';

    const name = workspace?.name || 'wksp';
    const filename = `${name}-${containerName}.log`;
    const anchor = document.createElement('a');
    anchor.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(logs));
    anchor.setAttribute('download', filename);
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  render() {
    const { isExpanded, pod } = this.state;

    if (pod === undefined) {
      return this.showEmptyState();
    }

    const containerLogs = this.getContainerLogs(this.props, this.state);

    const expandedStyle = isExpanded ? styles.viewerExpanded : '';

    return (
      <PageSection className={expandedStyle} isFilled>
        <WorkspaceLogsToolsPanel
          isExpanded={isExpanded}
          leftPart={
            <WorkspaceLogsContainerSelector
              pod={pod}
              onContainerChange={name => this.handleContainerNameChange(name)}
            />
          }
          rightPart={
            <WorkspaceLogsViewerTools
              onToggle={isExpanded => this.handleExpansionToggle(isExpanded)}
              onDownload={() => this.handleDownload()}
            />
          }
        />
        <div className={styles.panelViewerDivider} />
        <WorkspaceLogsViewer isExpanded={isExpanded} logsData={containerLogs} />
      </PageSection>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  allPods: selectAllPods(state),
  podLogsFn: selectPodLogs(state),
});

const connector = connect(mapStateToProps, LogsStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(WorkspaceLogs);
