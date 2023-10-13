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

import common from '@eclipse-che/common';
import {
  AlertVariant,
  PageSection,
  PageSectionVariants,
  Tab,
  Tabs,
  Title,
} from '@patternfly/react-core';
import { History } from 'history';
import { load } from 'js-yaml';
import React, { Suspense } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import Fallback from '@/components/Fallback';
import Head from '@/components/Head';
import { lazyInject } from '@/inversify.config';
import { ROUTE } from '@/Routes/routes';
import { AppAlerts } from '@/services/alerts/appAlerts';
import devfileApi from '@/services/devfileApi';
import { FactoryParams } from '@/services/helpers/factoryFlow/buildFactoryParams';
import getRandomString from '@/services/helpers/random';
import { AlertItem, CreateWorkspaceTab } from '@/services/helpers/types';
import { isCheDevfile, Workspace } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import { selectRegistriesErrors } from '@/store/DevfileRegistries/selectors';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import * as WorkspaceStore from '@/store/Workspaces';
import { selectWorkspaceByQualifiedName } from '@/store/Workspaces/selectors';

const SamplesListTab = React.lazy(() => import('./GetStartedTab'));

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
    devfile: devfileApi.Devfile,
    stackName: string | undefined,
    infrastructureNamespace: string | undefined,
    optionalFilesContent?: {
      [fileName: string]: string;
    },
  ): Promise<void> {
    const attr: Partial<FactoryParams> = {};
    if (stackName) {
      attr.factoryId = stackName;
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
      await this.props.createWorkspaceFromDevfile(devfile, attr, optionalFilesContent);
      this.props.setWorkspaceQualifiedName(namespace, devfile.metadata.name);
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

  private handleDevfileContent(
    devfileContent: string,
    attrs: { stackName?: string; infrastructureNamespace?: string },
    optionalFilesContent?: {
      [fileName: string]: string;
    },
  ): Promise<void> {
    try {
      const devfile = load(devfileContent) as devfileApi.Devfile;
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

  render(): React.ReactNode {
    const { activeTabKey } = this.state;
    const title = 'Create Workspace';
    const quickAddTab: CreateWorkspaceTab = 'quick-add';

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
          </Tabs>
        </PageSection>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  registriesErrors: selectRegistriesErrors(state),
  activeWorkspace: selectWorkspaceByQualifiedName(state),
  defaultNamespace: selectDefaultNamespace(state),
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(GetStarted);
