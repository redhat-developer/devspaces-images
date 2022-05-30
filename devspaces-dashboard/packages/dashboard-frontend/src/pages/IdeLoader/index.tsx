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

import { PageSection, PageSectionVariants, Tab, Tabs } from '@patternfly/react-core';
import React from 'react';
import Head from '../../components/Head';
import Header from '../../components/Header';
import { LoaderStep } from '../../components/Loader/Step';
import { AlertItem, DevWorkspaceStatus, IdeLoaderTab } from '../../services/helpers/types';
import { LoaderProgress } from '../../components/Loader/Progress';
import { LoaderAlert } from '../../components/Loader/Alert';
import WorkspaceLogs from '../../components/WorkspaceLogs';
import { Workspace } from '../../services/workspace-adapter';

import styles from './index.module.css';

export type Props = {
  alertItem: AlertItem | undefined;
  currentStepId: number;
  steps: LoaderStep[];
  tabParam: string | undefined;
  matchParams: {
    namespace: string;
    workspaceName: string;
  };
  workspace: Workspace | undefined;
  onWorkspaceRestart: () => void;
};
export type State = {
  activeTabKey: IdeLoaderTab;
  isPopupAlertVisible: boolean;
};

export class IdeLoader extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const { tabParam } = this.props;
    const activeTabKey =
      tabParam && IdeLoaderTab[tabParam] ? IdeLoaderTab[tabParam] : IdeLoaderTab.Progress;

    this.state = {
      activeTabKey,
      isPopupAlertVisible: false,
    };
  }

  private handleTabClick(tabIndex: React.ReactText): void {
    this.setState({
      activeTabKey: tabIndex as IdeLoaderTab,
      isPopupAlertVisible: tabIndex === IdeLoaderTab.Logs,
    });
  }

  private handleWorkspaceRestart(verbose: boolean): void {
    this.setState({
      activeTabKey: verbose ? IdeLoaderTab.Logs : IdeLoaderTab.Progress,
    });
    this.props.onWorkspaceRestart();
  }

  render(): React.ReactNode {
    const { alertItem, currentStepId, matchParams, steps, workspace } = this.props;
    const { activeTabKey } = this.state;

    const workspaceStatus = workspace?.status || DevWorkspaceStatus.STOPPED;
    const isToastAlert = activeTabKey === IdeLoaderTab.Logs;
    const wizardSteps = steps.map(step => step.toWizardStep(currentStepId));
    return (
      <React.Fragment>
        <Head pageName={`Loading ${matchParams.workspaceName}`} />
        <Header
          title={`Starting workspace ${matchParams.workspaceName}`}
          status={workspaceStatus}
        />
        <PageSection
          variant={PageSectionVariants.light}
          isFilled={true}
          className={styles.ideLoaderPage}
        >
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_event, tabIndex) => this.handleTabClick(tabIndex)}
            inset={{ default: 'insetLg' }}
            data-testid="ide-loader-tabs"
          >
            <Tab
              eventKey={IdeLoaderTab.Progress}
              title={IdeLoaderTab[IdeLoaderTab.Progress]}
              data-testid="ide-loader-progress-tab"
              id="ide-loader-progress-tab"
            >
              <PageSection>
                <LoaderAlert
                  isToast={isToastAlert}
                  alertItem={alertItem}
                  onRestart={verbose => this.handleWorkspaceRestart(verbose)}
                />
                <LoaderProgress steps={wizardSteps} currentStepId={currentStepId} />
              </PageSection>
            </Tab>
            <Tab
              eventKey={IdeLoaderTab.Logs}
              title={IdeLoaderTab[IdeLoaderTab.Logs]}
              data-testid="ide-loader-logs-tab"
              id="ide-loader-logs-tab"
            >
              <WorkspaceLogs
                workspaceUID={workspace?.uid}
                isDevWorkspace={workspace?.isDevWorkspace}
              />
            </Tab>
          </Tabs>
        </PageSection>
      </React.Fragment>
    );
  }
}
