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

import { PageSection, PageSectionVariants, Tab, Tabs } from '@patternfly/react-core';
import React from 'react';
import Head from '../../../components/Head';
import Header from '../../../components/Header';
import { LoaderAlert } from '../../../components/Loader/Alert';
import { LoaderProgress } from '../../../components/Loader/Progress';
import { LoaderStep } from '../../../components/Loader/Step';
import WorkspaceEvents from '../../../components/WorkspaceEvents';
import WorkspaceLogs from '../../../components/WorkspaceLogs';
import { AlertItem, DevWorkspaceStatus, LoaderTab } from '../../../services/helpers/types';
import { Workspace } from '../../../services/workspace-adapter';

import styles from './index.module.css';

export type Props = {
  activeTabKey: LoaderTab;
  alertItem: AlertItem | undefined;
  currentStepId: number;
  steps: LoaderStep[];
  workspace: Workspace | undefined;
  onTabChange: (tab: LoaderTab) => void;
};

export class CommonLoaderPage extends React.PureComponent<Props> {
  private handleTabClick(tabIndex: React.ReactText): void {
    this.props.onTabChange(tabIndex as LoaderTab);
  }

  render(): React.ReactNode {
    const { activeTabKey, alertItem, currentStepId, steps, workspace } = this.props;

    const pageTitle = workspace ? `Starting workspace ${workspace.name}` : 'Creating a workspace';
    const workspaceStatus = workspace?.status || DevWorkspaceStatus.STOPPED;
    const isToastAlert = activeTabKey === LoaderTab.Logs;
    const wizardSteps = LoaderStep.toWizardSteps(currentStepId, steps);

    return (
      <React.Fragment>
        <Head pageName={pageTitle} />
        <Header title={pageTitle} status={workspaceStatus} />
        <PageSection
          variant={PageSectionVariants.light}
          isFilled={true}
          className={styles.loaderPage}
        >
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_event, tabIndex) => this.handleTabClick(tabIndex)}
            inset={{ default: 'insetLg' }}
            data-testid="loader-tabs"
          >
            <Tab
              eventKey={LoaderTab.Progress}
              title={LoaderTab[LoaderTab.Progress]}
              data-testid="loader-progress-tab"
              id="loader-progress-tab"
            >
              <PageSection>
                <LoaderAlert isToast={isToastAlert} alertItem={alertItem} />
                <LoaderProgress steps={wizardSteps} currentStepId={currentStepId} />
              </PageSection>
            </Tab>
            <Tab
              eventKey={LoaderTab.Logs}
              title={LoaderTab[LoaderTab.Logs]}
              data-testid="loader-logs-tab"
              id="loader-logs-tab"
            >
              <WorkspaceLogs workspaceUID={workspace?.uid} />
            </Tab>
            <Tab
              eventKey={LoaderTab.Events}
              title={LoaderTab[LoaderTab.Events]}
              data-testid="loader-events-tab"
              id="loader-events-tab"
            >
              <WorkspaceEvents workspaceUID={workspace?.uid} />
            </Tab>
          </Tabs>
        </PageSection>
      </React.Fragment>
    );
  }
}
