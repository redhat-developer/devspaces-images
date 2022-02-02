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

import { AlertActionLink, AlertVariant } from '@patternfly/react-core';
import { History } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import common from '@eclipse-che/common';
import { lazyInject } from '../inversify.config';
import IdeLoader, { AlertOptions } from '../pages/IdeLoader';
import { Debounce } from '../services/helpers/debounce';
import { delay } from '../services/helpers/delay';
import {
  DeprecatedWorkspaceStatus,
  DevWorkspaceStatus,
  IdeLoaderTab,
  WorkspaceStatus,
} from '../services/helpers/types';
import { AppState } from '../store';
import { getEnvironment, isDevEnvironment } from '../services/helpers/environment';
import * as WorkspaceStore from '../store/Workspaces';
import {
  selectAllWorkspaces,
  selectIsLoading,
  selectLogs,
  selectWorkspaceById,
} from '../store/Workspaces/selectors';
import { buildWorkspacesLocation } from '../services/helpers/location';
import { DisposableCollection } from '../services/helpers/disposable';
import { Workspace } from '../services/workspace-adapter';
import { selectDevworkspacesEnabled } from '../store/Workspaces/Settings/selectors';

type Props = MappedProps & { history: History } & RouteComponentProps<{
    namespace: string;
    workspaceName: string;
  }>;

export enum LoadIdeSteps {
  INITIALIZING = 1,
  START_WORKSPACE,
  OPEN_IDE,
}

type State = {
  namespace: string;
  workspaceName: string;
  workspaceId?: string;
  currentStep: LoadIdeSteps;
  preselectedTabKey?: IdeLoaderTab;
  ideUrl?: string;
  hasError: boolean;
  hasStarted: boolean;
  isWaitingForRestart: boolean;
  isDevWorkspace: boolean;
  status: WorkspaceStatus | DevWorkspaceStatus | DeprecatedWorkspaceStatus;
};

class IdeLoaderContainer extends React.PureComponent<Props, State> {
  @lazyInject(Debounce)
  private readonly debounce: Debounce;

  private readonly ideLoaderCallbacks: {
    showAlert?: (alertOptions: AlertOptions) => void;
    hideAlert?: () => void;
  };
  private readonly isDevEnvironment: boolean;
  private readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    const env = getEnvironment();
    this.isDevEnvironment = isDevEnvironment(env);

    this.ideLoaderCallbacks = {};
    const {
      match: { params },
      history,
    } = this.props;
    const namespace = params.namespace;
    const workspaceName = this.workspaceName.split('&')[0];

    if (workspaceName !== this.workspaceName) {
      const pathname = `/ide/${namespace}/${workspaceName}`;
      history.replace({ pathname });
    }

    const workspace = this.props.allWorkspaces.find(
      workspace =>
        workspace.namespace === params.namespace && workspace.name === this.workspaceName,
    );
    const status =
      workspace?.status ||
      (this.props.devworkspacesEnabled ? DevWorkspaceStatus.STOPPED : WorkspaceStatus.STOPPED);
    this.state = {
      currentStep: LoadIdeSteps.INITIALIZING,
      namespace,
      isDevWorkspace: workspace?.isDevWorkspace || false,
      workspaceName,
      hasError: workspace?.hasError === true,
      preselectedTabKey: this.preselectedTabKey,
      isWaitingForRestart: false,
      hasStarted: false,
      status,
    };

    this.debounce.subscribe(async onStart => {
      if (onStart === false) {
        await this.applyIdeLoadingStep();
      }
    });
    this.toDispose.push({
      dispose: () => {
        this.debounce.unsubscribeAll();
      },
    });
  }

  private get workspaceName(): string {
    const {
      match: { params },
    } = this.props;
    return params.workspaceName.split('?')[0];
  }

  private get preselectedTabKey(): IdeLoaderTab {
    const {
      history: {
        location: { search },
      },
    } = this.props;
    if (!search) {
      return IdeLoaderTab.Progress;
    }
    const searchParam = new URLSearchParams(search);
    const tab = searchParam.get('tab');
    if (tab) {
      return IdeLoaderTab[tab];
    }
    return IdeLoaderTab.Progress;
  }

  public showAlert(alertOptions: string | AlertOptions): void {
    if (typeof alertOptions === 'string') {
      const currentAlertOptions = alertOptions;
      alertOptions = {
        title: currentAlertOptions,
        alertVariant: AlertVariant.danger,
      } as AlertOptions;
    }
    if (alertOptions.alertVariant === AlertVariant.danger && !this.state.hasError) {
      this.setState({ hasError: true });
    }
    if (this.ideLoaderCallbacks.showAlert) {
      this.ideLoaderCallbacks.showAlert(alertOptions);
    } else {
      console.error(alertOptions.title);
    }
  }

  private async handleIframeMessage(event: MessageEvent): Promise<void> {
    if (typeof event.data !== 'string') {
      return;
    }
    if (event.data === 'show-workspaces') {
      const location = buildWorkspacesLocation();
      this.props.history.push(location);
      window.postMessage('show-navbar', '*');
    } else if (event.data.startsWith('restart-workspace:')) {
      const {
        allWorkspaces,
        devworkspacesEnabled,
        match: { params },
      } = this.props;
      const workspace = allWorkspaces.find(
        workspace =>
          workspace.namespace === params.namespace && workspace.name === this.workspaceName,
      );
      if (!workspace) {
        return;
      }
      const workspaceId = event.data.split(':')[1];
      if (workspace.id !== workspaceId) {
        return;
      }
      if (devworkspacesEnabled === false) {
        window.postMessage('show-navbar', '*');
      }
      await this.restartWorkspace(workspace);
    }
  }

  private async restartWorkspace(workspace: Workspace): Promise<void> {
    this.setState({ isWaitingForRestart: true });
    try {
      await this.props.restartWorkspace(workspace);
      this.setState({ isWaitingForRestart: false });
    } catch (error) {
      this.setState({ isWaitingForRestart: false });
      const errorMessage = common.helpers.errors.getMessage(error);
      this.showAlert({
        title: errorMessage,
        alertVariant: AlertVariant.danger,
      });
    }
  }

  public async componentWillUnmount(): Promise<void> {
    this.toDispose.dispose();
  }

  public async componentDidMount(): Promise<void> {
    const listener = (event: MessageEvent) => this.handleIframeMessage(event);
    window.addEventListener('message', listener);
    this.toDispose.push({
      dispose: () => {
        window.removeEventListener('message', listener);
      },
    });

    const { isLoading, requestWorkspaces, allWorkspaces } = this.props;
    let workspace = allWorkspaces.find(
      workspace =>
        workspace.namespace === this.state.namespace && workspace.name === this.state.workspaceName,
    );
    if (!isLoading && !workspace) {
      await requestWorkspaces();
      workspace = allWorkspaces.find(
        workspace =>
          workspace.namespace === this.state.namespace &&
          workspace.name === this.state.workspaceName,
      );
    }
    if (workspace && workspace.ideUrl && workspace.isRunning) {
      return await this.updateIdeUrl(workspace.ideUrl);
    } else if (workspace && workspace.hasError) {
      this.showErrorAlert(workspace);
    }
    await this.applyIdeLoadingStep();
  }

  private showErrorAlert(workspace: Workspace) {
    const errorMessage = this.findErrorLogs(workspace) || 'Unknown error.';

    const alertActionLinks = this.errorActionLinks(workspace);
    this.showAlert({
      alertActionLinks: alertActionLinks,
      title: `Workspace ${this.state.workspaceName} failed to start`,
      alertVariant: AlertVariant.danger,
      body: errorMessage,
    });
  }

  public async componentDidUpdate(prevProps: Props, prevState: State): Promise<void> {
    const {
      allWorkspaces,
      match: { params },
    } = this.props;
    const workspace = allWorkspaces.find(
      workspace =>
        workspace.namespace === params.namespace && workspace.name === this.workspaceName,
    );
    if (workspace) {
      this.setState({
        status: workspace.status,
      });
      if (!this.state.hasStarted && workspace.isStarting) {
        this.setState({ hasStarted: true });
      }
    }
    if (this.state.isWaitingForRestart) {
      return;
    }
    if (!workspace) {
      this.showAlert({
        title: `Workspace "${this.workspaceName}" is not found.`,
        alertVariant: AlertVariant.danger,
      });
    } else if (workspace.hasError) {
      if (prevState.workspaceName === this.workspaceName) {
        // When the current workspace didn't have an error but now does then show it
        this.showErrorAlert(workspace);
      } else if (prevState.workspaceName !== this.workspaceName) {
        // When the clicked workspace changes and the new one errors then show the new error message
        this.setState({
          workspaceName: this.workspaceName,
          currentStep: LoadIdeSteps.START_WORKSPACE,
          workspaceId: workspace.id,
          hasStarted: false,
        });
        this.showErrorAlert(workspace);
      }
      if (workspace.hasError && !this.state.hasError) {
        this.setState({
          hasError: workspace.hasError,
          hasStarted: false,
        });
      }
    } else if (prevState.workspaceName !== this.workspaceName) {
      await this.applyIdeLoadingStep();
      return;
    } else if (prevState.isWaitingForRestart) {
      this.setState({
        currentStep: LoadIdeSteps.START_WORKSPACE,
      });
    }
    this.checkOnStoppingStatus(workspace);
    this.debounce.execute(1000);
  }

  private checkOnStoppingStatus(workspace?: Workspace): void {
    if (!workspace) {
      return;
    }
    if (workspace.isStopping) {
      this.setState({
        currentStep: LoadIdeSteps.START_WORKSPACE,
      });
    } else if (
      this.state.hasStarted &&
      workspace?.isStopped &&
      this.state.currentStep !== LoadIdeSteps.INITIALIZING
    ) {
      this.showAlert({
        title: `Workspace "${this.workspaceName}" has failed to start.`,
        alertVariant: AlertVariant.danger,
      });
    }
  }

  private findErrorLogs(workspace: Workspace): string {
    const errorRe = workspace.isDevWorkspace ? /^[1-9]{0,5} error occurred:/i : /^Error: /i;
    const wsLogs = this.props.workspacesLogs.get(workspace.id) || [];

    const errorLogs: string[] = [];
    wsLogs.forEach(e => {
      if (errorRe.test(e)) {
        const message = e.replace(errorRe, '');
        errorLogs.push(message);
      }
    });
    return errorLogs.join('\n');
  }

  private errorActionLinks(workspace: Workspace): React.ReactFragment {
    return (
      <React.Fragment>
        <AlertActionLink
          onClick={async () => {
            await this.handleRestart(workspace);
          }}
        >
          Restart
        </AlertActionLink>
        <AlertActionLink
          onClick={async () => {
            this.verboseModeHandler(workspace);
          }}
        >
          Open in Verbose mode
        </AlertActionLink>
      </React.Fragment>
    );
  }

  private async handleRestart(workspace: Workspace): Promise<void> {
    this.props.deleteWorkspaceLogs(workspace.id);

    try {
      await this.restartWorkspace(workspace);
    } catch (e) {
      // noop
    }
  }

  private async verboseModeHandler(workspace: Workspace): Promise<void> {
    this.logsHandler();

    try {
      await this.props.startWorkspace(workspace, { 'debug-workspace-start': true });
      this.props.deleteWorkspaceLogs(workspace.id);
      this.setState({
        currentStep: LoadIdeSteps.INITIALIZING,
        hasError: false,
      });
    } catch (e) {
      this.showAlert(`Workspace ${this.state.workspaceName} failed to start. ${e}`);
    }
  }

  private logsHandler() {
    const elements: any = Array.from(document.getElementsByClassName('pf-c-tabs__item'));
    for (const ele of elements) {
      if (ele.innerText === 'Logs') {
        ele.firstChild.click();
      }
    }
  }

  private async updateIdeUrl(ideUrl: string): Promise<void> {
    if (this.isDevEnvironment) {
      // workaround to open IDE in iframe while serving dashboard locally
      try {
        const windowRef = window.open(ideUrl);
        await delay(2000);
        windowRef?.close();
      } catch (e) {
        // noop
      }
    }
    this.setState({ currentStep: LoadIdeSteps.OPEN_IDE, ideUrl });
  }

  private async openIDE(cheWorkspace: Workspace): Promise<void> {
    this.setState({ currentStep: LoadIdeSteps.OPEN_IDE });
    try {
      await this.props.requestWorkspace(cheWorkspace);
    } catch (e) {
      this.showAlert(`Getting workspace detail data failed. ${e}`);
      return;
    }
    const workspace = this.props.allWorkspaces.find(workspace => workspace.id === cheWorkspace.id);
    if (workspace && workspace.ideUrl) {
      await this.updateIdeUrl(workspace.ideUrl);
    }
  }

  private async applyIdeLoadingStep(): Promise<void> {
    const {
      allWorkspaces,
      match: { params },
    } = this.props;
    const { namespace, workspaceName } = this.state;

    const workspace = allWorkspaces.find(
      workspace =>
        workspace.namespace === params.namespace && workspace.name === this.workspaceName,
    );
    if (namespace !== params.namespace || workspaceName !== this.workspaceName) {
      this.setState({
        currentStep: LoadIdeSteps.INITIALIZING,
        hasError: workspace?.hasError === true,
        ideUrl: '',
        namespace: params.namespace,
        workspaceName: this.workspaceName,
        hasStarted: false,
      });
      return;
    } else if (this.state.currentStep === LoadIdeSteps.OPEN_IDE) {
      return;
    }
    if (workspace) {
      if (this.state.workspaceId !== workspace.id) {
        this.props.setWorkspaceId(workspace.id);
        this.setState({ workspaceId: workspace.id });
      }
      if (
        (workspace.ideUrl || this.state.currentStep === LoadIdeSteps.START_WORKSPACE) &&
        workspace.isRunning
      ) {
        return this.openIDE(workspace);
      }
    } else {
      if (this.props.workspace) {
        this.props.clearWorkspaceId();
      }
      this.showAlert('Failed to find the target workspace.');
      return;
    }
    if (this.state.currentStep === LoadIdeSteps.INITIALIZING) {
      this.setState({ currentStep: LoadIdeSteps.START_WORKSPACE });
      await this.props.requestWorkspace(workspace);
      if (this.props.workspace?.isStopped) {
        try {
          await this.props.startWorkspace(workspace);
        } catch (e) {
          this.showAlert(`Workspace ${this.state.workspaceName} failed to start. ${e}`);
          return;
        }
      }
    }
  }

  render() {
    const {
      currentStep,
      hasError,
      ideUrl,
      workspaceId,
      workspaceName,
      preselectedTabKey,
      isDevWorkspace,
      status,
    } = this.state;
    return (
      <IdeLoader
        currentStep={currentStep}
        isDevWorkspace={isDevWorkspace}
        workspaceId={workspaceId || ''}
        preselectedTabKey={preselectedTabKey}
        ideUrl={ideUrl}
        hasError={hasError}
        status={status}
        workspaceName={workspaceName || ''}
        callbacks={this.ideLoaderCallbacks}
      />
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  workspace: selectWorkspaceById(state),
  allWorkspaces: selectAllWorkspaces(state),
  isLoading: selectIsLoading(state),
  workspacesLogs: selectLogs(state),
  devworkspacesEnabled: selectDevworkspacesEnabled(state),
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators);
type MappedProps = ConnectedProps<typeof connector>;
export default connector(IdeLoaderContainer);
