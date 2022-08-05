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
import { LoaderStep } from '../../../components/Loader/Step';
import { AlertItem, LoaderTab } from '../../../services/helpers/types';
import { ActionCallback } from '../../../components/Loader/Alert';
import { Workspace } from '../../../services/workspace-adapter';

import { CommonLoaderPage } from '../Common';

export type Props = {
  alertItem: AlertItem | undefined;
  currentStepId: number;
  steps: LoaderStep[];
  tabParam: string | undefined;
  workspace: Workspace | undefined;
  onRestart: () => void;
};
export type State = {
  activeTabKey: LoaderTab;
  isPopupAlertVisible: boolean;
};

export class WorkspaceLoaderPage extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const { tabParam } = this.props;
    const activeTabKey = tabParam && LoaderTab[tabParam] ? LoaderTab[tabParam] : LoaderTab.Progress;

    this.state = {
      activeTabKey,
      isPopupAlertVisible: false,
    };
  }

  private handleRestart(verbose: boolean): void {
    this.setState({
      activeTabKey: verbose ? LoaderTab.Logs : LoaderTab.Progress,
    });
    this.props.onRestart();
  }

  private handleTabChange(tabKey: LoaderTab): void {
    this.setState({
      activeTabKey: tabKey,
    });
  }

  render(): React.ReactNode {
    const { alertItem, currentStepId, steps, workspace } = this.props;
    const { activeTabKey } = this.state;

    const actionCallbacks: ActionCallback[] = [
      {
        title: 'Restart',
        callback: () => this.handleRestart(false),
      },
      {
        title: 'Open in Verbose mode',
        callback: () => this.handleRestart(true),
      },
    ];

    return (
      <CommonLoaderPage
        actionCallbacks={actionCallbacks}
        activeTabKey={activeTabKey}
        alertItem={alertItem}
        currentStepId={currentStepId}
        steps={steps}
        workspace={workspace}
        onTabChange={tabKey => this.handleTabChange(tabKey)}
      />
    );
  }
}
