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
import { PageSection, PageSectionVariants, Tab, Tabs } from '@patternfly/react-core';
import Head from '../../../components/Head';
import Header from '../../../components/Header';
import { LoaderStep } from '../../../components/Loader/Step';
import { AlertItem, DevWorkspaceStatus, LoaderTab } from '../../../services/helpers/types';
import { LoaderProgress } from '../../../components/Loader/Progress';
import { LoaderAlert } from '../../../components/Loader/Alert';
import WorkspaceLogs from '../../../components/WorkspaceLogs';
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
