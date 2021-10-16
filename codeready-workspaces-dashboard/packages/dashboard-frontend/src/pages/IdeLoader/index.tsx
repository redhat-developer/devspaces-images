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

import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertVariant,
  PageSection,
  PageSectionVariants,
  Tab,
  Tabs,
  Wizard,
  WizardStep,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { ExclamationCircleIcon, InProgressIcon } from '@patternfly/react-icons/dist/js/icons';
import React, { RefObject } from 'react';
import Head from '../../components/Head';
import Header from '../../components/Header';
import WorkspaceLogs from '../../components/LogsTab';
import { LoadIdeSteps } from '../../containers/IdeLoader';
import { delay } from '../../services/helpers/delay';
import { IdeLoaderTab } from '../../services/helpers/types';

import workspaceStatusLabelStyles from '../../components/WorkspaceStatusLabel/index.module.css';
import './IdeLoader.styl';

export const SECTION_THEME = PageSectionVariants.light;

type Props = {
  currentStep: LoadIdeSteps;
  hasError: boolean;
  ideUrl?: string;
  preselectedTabKey?: IdeLoaderTab;
  status: string | undefined;
  workspaceId: string;
  workspaceName: string;
  isDevWorkspace: boolean;
  callbacks?: {
    showAlert?: (alertOptions: AlertOptions) => void
  };
};

type State = {
  ideUrl?: string;
  workspaceId: string;
  alertVisible: boolean;
  activeTabKey: IdeLoaderTab;
  currentRequestError: string;
  currentAlertVariant?: AlertVariant;
  alertActionLinks?: React.ReactFragment;
  alertBody?: string | undefined;
  isDevWorkspace: boolean;
};

export type AlertOptions = {
  title: string;
  timeDelay?: number;
  alertActionLinks?: React.ReactFragment;
  alertVariant: AlertVariant;
  body?: string;
};

class IdeLoader extends React.PureComponent<Props, State> {
  private readonly hideAlert: () => void;
  private readonly handleTabClick: (event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: React.ReactText) => void;
  public showAlert: (options: AlertOptions) => void;

  private readonly wizardRef: RefObject<any>;

  constructor(props: Props) {
    super(props);

    this.state = {
      alertVisible: false,
      currentRequestError: '',
      isDevWorkspace: this.props.isDevWorkspace,
      workspaceId: this.props.workspaceId,
      activeTabKey: this.props.preselectedTabKey ? this.props.preselectedTabKey : IdeLoaderTab.Progress,
    };

    this.wizardRef = React.createRef();

    // Toggle currently active tab
    this.handleTabClick = (event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: React.ReactText): void => {
      this.setState({ activeTabKey: tabIndex as IdeLoaderTab });
      if (this.state.activeTabKey === IdeLoaderTab.Progress) {
        this.setState({ alertVisible: false });
      }
    };

    // Init showAlert
    let showAlertTimer: number;
    this.showAlert = (alertOptions: AlertOptions): void => {
      this.setState({ currentRequestError: alertOptions.title, currentAlertVariant: alertOptions.alertVariant, alertActionLinks: alertOptions?.alertActionLinks, alertBody: alertOptions?.body });
      if (this.state.activeTabKey === IdeLoaderTab.Progress) {
        return;
      }
      this.setState({ alertVisible: true });
      if (showAlertTimer) {
        clearTimeout(showAlertTimer);
      }
      showAlertTimer = window.setTimeout(() => {
        this.setState({ alertVisible: false });
      }, alertOptions.alertVariant === AlertVariant.success ? 2000 : 10000);
    };
    this.hideAlert = (): void => this.setState({ alertVisible: false });
    // Prepare showAlert as a callback
    if (this.props.callbacks && !this.props.callbacks.showAlert) {
      this.props.callbacks.showAlert = (alertOptions: AlertOptions) => {
        this.showAlert(alertOptions);
      };
    }
  }

  private showOnlyContentIfDevWorkspace() : void {
    if (this.state.isDevWorkspace) {
      // hide all bars
      window.postMessage('hide-allbar', '*');
    }
  }

  public componentDidMount(): void {
    this.showOnlyContentIfDevWorkspace();
    if (this.props.ideUrl) {
      this.setState({ ideUrl: this.props.ideUrl });
    }
    if (this.props.workspaceId) {
      this.setState({ workspaceId: this.props.workspaceId });
    }
  }

  public async componentDidUpdate(): Promise<void> {
    this.showOnlyContentIfDevWorkspace();
    const { currentStep, hasError, ideUrl, workspaceId } = this.props;

    const current = this.wizardRef.current;
    if (current && current.state && current.state.currentStep !== currentStep && !hasError) {
      current.state.currentStep = currentStep;
    }

    if (!hasError && this.state.currentRequestError) {
      this.setState({ currentRequestError: '' });
    }

    if (this.state.workspaceId !== workspaceId) {
      this.setState({
        workspaceId,
        alertVisible: false,
      });
    }

    if (this.state.ideUrl !== ideUrl) {
      this.setState({ ideUrl });
      if (ideUrl) {
        if (this.state.isDevWorkspace) {
          // in case of DevWorkspace, refresh the current window
          await this.openInCurrentWindow(ideUrl);
        } else {
          // else, update the iFrame
          await this.updateIdeIframe(ideUrl, 10);
        }
      }
    }
  }

  // Open the link in the current window
  private async openInCurrentWindow(url: string): Promise<void> {
    window.location.replace(url);
  }

  private async updateIdeIframe(url: string, repeat?: number): Promise<void> {
    const iframeElement = document.getElementById('ide-iframe');
    if (iframeElement) {
      iframeElement['src'] = url;
    } else if (repeat) {
      await delay(500);
      return this.updateIdeIframe(url, --repeat);
    } else {
      const message = 'Cannot find IDE iframe element.';
      this.showAlert({
        alertVariant: AlertVariant.warning,
        title: message
      });
      console.error(message);
    }
  }

  private getIcon(step: LoadIdeSteps, className = ''): React.ReactNode {
    const { currentStep, hasError } = this.props;
    if (currentStep > step) {
      return (<React.Fragment>
        <CheckCircleIcon className={className} color="green" />
      </React.Fragment>);
    } else if (currentStep === step) {
      if (hasError) {
        return <ExclamationCircleIcon className={className} color="red" />;
      }
      return (<React.Fragment>
        <InProgressIcon className={`${workspaceStatusLabelStyles.rotate} ${className}`} color="#0e6fe0" />
      </React.Fragment>);
    }
    return '';
  }

  private getSteps(): WizardStep[] {
    const { currentStep, hasError } = this.props;

    const getTitle = (step: LoadIdeSteps, title: string, iconClass?: string) => {
      let className = '';
      if (currentStep === step) {
        className = hasError ? 'error' : 'progress';
      }
      return (
        <React.Fragment>
          {this.getIcon(step, iconClass)}
          <span className={className}>{title}</span>
        </React.Fragment>
      );
    };

    return [
      {
        id: LoadIdeSteps.INITIALIZING,
        name: getTitle(
          LoadIdeSteps.INITIALIZING,
          'Initializing',
          'wizard-icon'),
        canJumpTo: currentStep >= LoadIdeSteps.INITIALIZING,
      },
      {
        id: LoadIdeSteps.START_WORKSPACE,
        name: getTitle(
          LoadIdeSteps.START_WORKSPACE,
          'Waiting for workspace to start',
          'wizard-icon'),
        canJumpTo: currentStep >= LoadIdeSteps.START_WORKSPACE,
      },
      {
        id: LoadIdeSteps.OPEN_IDE,
        name: getTitle(
          LoadIdeSteps.OPEN_IDE,
          'Open IDE',
          'wizard-icon'),
        canJumpTo: currentStep >= LoadIdeSteps.OPEN_IDE,
      },
    ];
  }

  public render(): React.ReactElement {
    const { workspaceName, workspaceId, ideUrl, status, currentStep } = this.props;
    const { alertVisible, currentAlertVariant, currentRequestError, alertActionLinks } = this.state;

    if (ideUrl) {
      return (
        <div className="ide-iframe-page">
          <iframe id="ide-iframe" src="./static/loader.html" allow="fullscreen *;clipboard-write *;clipboard-read *" />
        </div>
      );
    }

    return (
      <React.Fragment>
        <Head pageName={`Loading ${workspaceName}`} />
        {alertVisible && (
          <AlertGroup isToast>
            <Alert
              variant={currentAlertVariant}
              title={currentRequestError}
              actionClose={<AlertActionCloseButton onClose={this.hideAlert} />}
              actionLinks={alertActionLinks}
            />
          </AlertGroup>
        )}
        <Header title={`Starting workspace ${workspaceName}`}
          status={status} />
        <PageSection variant={SECTION_THEME} className="ide-loader-page" isFilled={true}>
          <Tabs activeKey={this.state.activeTabKey} onSelect={this.handleTabClick} inset={{ default: 'insetLg' }}
            id="ide-loader-page-tabs">
            <Tab eventKey={IdeLoaderTab.Progress} title={IdeLoaderTab[IdeLoaderTab.Progress]}
              id="ide-loader-page-wizard-tab">
              <PageSection>
                {(this.state.currentRequestError) && (
                  <Alert
                    isInline
                    variant={currentAlertVariant}
                    title={currentRequestError}
                    actionClose={<AlertActionCloseButton
                      onClose={() => this.setState({ currentRequestError: '' })} />}
                    actionLinks={alertActionLinks}
                  >
                    {this.state.alertBody}
                  </Alert>
                )}
                <Wizard
                  className="ide-loader-wizard"
                  steps={this.getSteps()}
                  ref={this.wizardRef}
                  footer={(<span />)}
                  height={500}
                  startAtStep={currentStep}
                />
              </PageSection>
            </Tab>
            <Tab eventKey={IdeLoaderTab.Logs} title={IdeLoaderTab[IdeLoaderTab.Logs]}
              id="ide-loader-page-logs-tab">
              <WorkspaceLogs
                workspaceId={workspaceId}
                isDevWorkspace={this.props.isDevWorkspace}
              />
            </Tab>
          </Tabs>
        </PageSection>
      </React.Fragment>
    );
  }
}

export default IdeLoader;
