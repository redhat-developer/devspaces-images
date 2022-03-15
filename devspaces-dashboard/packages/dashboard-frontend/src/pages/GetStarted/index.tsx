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

import React, { Suspense } from 'react';
import { History } from 'history';
import { connect, ConnectedProps } from 'react-redux';
import { load } from 'js-yaml';
import {
  AlertVariant,
  PageSection,
  PageSectionVariants,
  Tab,
  Tabs,
  Title,
} from '@patternfly/react-core';
import common from '@eclipse-che/common';
import Fallback from '../../components/Fallback';
import Head from '../../components/Head';
import { lazyInject } from '../../inversify.config';
import { AppAlerts } from '../../services/alerts/appAlerts';
import * as WorkspaceStore from '../../store/Workspaces';
import { AppState } from '../../store';
import { AlertItem, CreateWorkspaceTab } from '../../services/helpers/types';
import { ROUTE } from '../../route.enum';
import { Workspace } from '../../services/workspace-adapter';
import { selectBranding } from '../../store/Branding/selectors';
import { selectRegistriesErrors } from '../../store/DevfileRegistries/selectors';
import { Devfile, isCheDevfile } from '../../services/workspace-adapter';
import { selectWorkspaceByQualifiedName } from '../../store/Workspaces/selectors';
import { selectDefaultNamespace } from '../../store/InfrastructureNamespaces/selectors';
import getRandomString from '../../services/helpers/random';
import { selectWorkspacesSettings } from '../../store/Workspaces/Settings/selectors';
import { isDevworkspacesEnabled } from '../../services/helpers/devworkspace';

const SamplesListTab = React.lazy(() => import('./GetStartedTab'));
const CustomWorkspaceTab = React.lazy(() => import('./CustomWorkspaceTab'));

type Props = MappedProps & {
  history: History;
};

type State = {
  activeTabKey: CreateWorkspaceTab;
};

export class GetStarted extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    const activeTabKey = this.getActiveTabKey();

    this.state = {
      activeTabKey,
    };
  }

  public componentDidMount(): void {
    if (this.props.registriesErrors.length) {
      this.showErrors();
    }
  }

  public componentDidUpdate(): void {
    const activeTabKey = this.getActiveTabKey();
    if (this.state.activeTabKey !== activeTabKey) {
      this.setState({ activeTabKey });
    }

    if (this.props.registriesErrors.length) {
      this.showErrors();
    }
  }

  private showErrors(): void {
    const { registriesErrors } = this.props;
    registriesErrors.forEach(error => {
      const key = 'registry-error-' + error.url;
      this.appAlerts.removeAlert(key);
      this.appAlerts.showAlert({
        key,
        title: error.errorMessage,
        variant: AlertVariant.danger,
      });
    });
  }

  private getActiveTabKey(): CreateWorkspaceTab {
    const { pathname, search } = this.props.history.location;

    if (search) {
      const searchParam = new URLSearchParams(search.substring(1));
      if (
        pathname === ROUTE.GET_STARTED &&
        (searchParam.get('tab') as CreateWorkspaceTab) === 'custom-workspace'
      ) {
        return 'custom-workspace';
      }
    }

    return 'quick-add';
  }

  private async createWorkspace(
    devfile: Devfile,
    stackName: string | undefined,
    infrastructureNamespace: string | undefined,
    optionalFilesContent?: {
      [fileName: string]: string;
    },
  ): Promise<void> {
    const attr: { [key: string]: string } = {};
    if (stackName) {
      attr.stackName = stackName;
    }
    if (isCheDevfile(devfile) && !devfile.metadata.name && devfile.metadata.generateName) {
      const name = devfile.metadata.generateName + getRandomString(4).toLowerCase();
      delete devfile.metadata.generateName;
      devfile.metadata.name = name;
    }
    const namespace = infrastructureNamespace
      ? infrastructureNamespace
      : this.props.defaultNamespace.name;
    let workspace: Workspace | undefined;
    try {
      await this.props.createWorkspaceFromDevfile(
        devfile,
        undefined,
        namespace,
        attr,
        optionalFilesContent,
      );
      this.props.setWorkspaceQualifiedName(namespace, devfile.metadata.name as string);
      workspace = this.props.activeWorkspace;
    } catch (e) {
      const errorMessage = common.helpers.errors.getMessage(e);
      this.showAlert({
        key: 'new-workspace-failed',
        variant: AlertVariant.danger,
        title: errorMessage,
      });
      throw e;
    }

    if (!workspace) {
      const errorMessage = `Workspace "${namespace}/${devfile.metadata.name}" not found.`;
      this.showAlert({
        key: 'find-workspace-failed',
        variant: AlertVariant.danger,
        title: errorMessage,
      });
      throw errorMessage;
    }

    const workspaceName = workspace.name;
    this.showAlert({
      key: 'new-workspace-success',
      variant: AlertVariant.success,
      title: `Workspace ${workspaceName} has been created.`,
    });

    // force start for the new workspace
    try {
      this.props.history.push(`/ide/${workspace.namespace}/${workspaceName}`);
    } catch (error) {
      const errorMessage = common.helpers.errors.getMessage(error);
      this.showAlert({
        key: 'start-workspace-failed',
        variant: AlertVariant.warning,
        title: `Workspace ${workspaceName} failed to start. ${errorMessage}`,
      });
      throw new Error(errorMessage);
    }
  }

  private handleDevfile(
    devfile: Devfile,
    attrs: { stackName?: string; infrastructureNamespace?: string },
    optionalFilesContent: { [fileName: string]: string } | undefined,
  ): Promise<void> {
    return this.createWorkspace(
      devfile,
      attrs.stackName,
      attrs.infrastructureNamespace,
      optionalFilesContent || {},
    );
  }

  private handleDevfileContent(
    devfileContent: string,
    attrs: { stackName?: string; infrastructureNamespace?: string },
    optionalFilesContent?: {
      [fileName: string]: string;
    },
  ): Promise<void> {
    try {
      const devfile = load(devfileContent);
      return this.createWorkspace(
        devfile,
        attrs.stackName,
        attrs.infrastructureNamespace,
        optionalFilesContent,
      );
    } catch (e) {
      const errorMessage = 'Failed to parse the devfile';
      this.showAlert({
        key: 'parse-devfile-failed',
        variant: AlertVariant.danger,
        title: errorMessage + '.',
      });
      throw new Error(errorMessage + ', \n' + e);
    }
  }

  private showAlert(alert: AlertItem): void {
    this.appAlerts.showAlert(alert);
  }

  private handleTabClick(
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    activeTabKey: React.ReactText,
  ): void {
    this.props.history.push(`${ROUTE.GET_STARTED}?tab=${activeTabKey}`);

    this.setState({
      activeTabKey: activeTabKey as CreateWorkspaceTab,
    });
  }

  render(): React.ReactNode {
    const { activeTabKey } = this.state;
    const title = 'Create Workspace';
    const quickAddTab: CreateWorkspaceTab = 'quick-add';
    const customWorkspaceTab: CreateWorkspaceTab = 'custom-workspace';
    const isCustomWorkspaceHidden = isDevworkspacesEnabled(this.props.workspacesSettings);

    return (
      <React.Fragment>
        <Head pageName="Create Workspace" />
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel={'h1'}>{title}</Title>
        </PageSection>
        <PageSection
          variant={PageSectionVariants.light}
          className="pf-c-page-section-no-padding"
          isFilled={false}
        >
          <Tabs
            style={{ paddingTop: 'var(--pf-c-page__main-section--PaddingTop)' }}
            activeKey={activeTabKey}
            onSelect={(event, tabKey) => this.handleTabClick(event, tabKey)}
          >
            <Tab eventKey={quickAddTab} title="Quick Add">
              <Suspense fallback={Fallback}>
                <SamplesListTab
                  onDevfile={(devfileContent: string, stackName: string, optionalFilesContent) => {
                    return this.handleDevfileContent(
                      devfileContent,
                      { stackName },
                      optionalFilesContent,
                    );
                  }}
                />
              </Suspense>
            </Tab>
            <Tab
              eventKey={customWorkspaceTab}
              isHidden={isCustomWorkspaceHidden}
              title="Custom Workspace"
            >
              <Suspense fallback={Fallback}>
                <CustomWorkspaceTab
                  onDevfile={(devfile, infrastructureNamespace, optionalFilesContent) => {
                    return this.handleDevfile(
                      devfile,
                      { infrastructureNamespace },
                      optionalFilesContent,
                    );
                  }}
                />
              </Suspense>
            </Tab>
          </Tabs>
        </PageSection>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  branding: selectBranding(state),
  registriesErrors: selectRegistriesErrors(state),
  activeWorkspace: selectWorkspaceByQualifiedName(state),
  defaultNamespace: selectDefaultNamespace(state),
  workspacesSettings: selectWorkspacesSettings(state),
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(GetStarted);
