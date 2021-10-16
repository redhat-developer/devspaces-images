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

import { CheckCircleIcon } from '@patternfly/react-icons';
import { ExclamationCircleIcon, InProgressIcon } from '@patternfly/react-icons/dist/js/icons';
import React, { RefObject } from 'react';
import {
  PageSection,
  PageSectionVariants,
  Tabs,
  Tab,
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertVariant,
  Wizard, WizardStep,
} from '@patternfly/react-core';
import Head from '../../components/Head';
import Header from '../../components/Header';
import { LoadFactorySteps } from '../../containers/FactoryLoader';
import { WorkspaceStatus } from '../../services/helpers/types';
import WorkspaceLogs from '../../components/LogsTab';

import workspaceStatusLabelStyles from '../../components/WorkspaceStatusLabel/index.module.css';
import './FactoryLoader.styl';

const SECTION_THEME = PageSectionVariants.light;

export enum LoadFactoryTabs {
  Progress = 0,
  Logs = 1,
}

export type AlertOptions = {
  title: string;
  timeDelay?: number;
  alertActionLinks?: React.ReactFragment;
  alertVariant: AlertVariant;
};

type Props = {
  hasError: boolean,
  currentStep: LoadFactorySteps,
  workspaceName: string;
  workspaceId: string;
  isDevWorkspace: boolean;
  resolvedDevfileMessage?: string;
  callbacks?: {
    showAlert?: (options: AlertOptions) => void
  }
};

type State = {
  alertVisible: boolean;
  activeTabKey: LoadFactoryTabs;
  currentRequestError: string;
  currentAlertVariant?: AlertVariant;
  alertActionLinks?: React.ReactFragment;
};

class FactoryLoader extends React.PureComponent<Props, State> {
  public showAlert: (options: AlertOptions) => void;
  private readonly hideAlert: () => void;
  private readonly handleTabClick: (event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: React.ReactText) => void;

  private readonly wizardRef: RefObject<any>;

  constructor(props) {
    super(props);

    this.state = {
      alertVisible: false,
      activeTabKey: LoadFactoryTabs.Progress,
      currentRequestError: '',
    };

    this.wizardRef = React.createRef();

    // Toggle currently active tab
    this.handleTabClick = (event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: React.ReactText): void => {
      this.setState({ activeTabKey: tabIndex as LoadFactoryTabs });
      if (this.state.activeTabKey === LoadFactoryTabs.Progress) {
        this.setState({ alertVisible: false });
      }
    };
    // Init showAlert
    let showAlertTimer: number;
    this.showAlert = (alertOptions: AlertOptions): void => {
      this.setState({ currentRequestError: alertOptions.title, currentAlertVariant: alertOptions.alertVariant, alertActionLinks: alertOptions?.alertActionLinks });
      if (this.state.activeTabKey === LoadFactoryTabs.Progress) {
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

  public componentDidUpdate(): void {
    const { currentStep, hasError } = this.props;

    const current = this.wizardRef.current;
    if (current && current.state && current.state.currentStep !== currentStep && !hasError) {
      current.state.currentStep = currentStep;
    }
  }

  private getIcon(step: LoadFactorySteps, className = ''): React.ReactNode {
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
    const { currentStep, resolvedDevfileMessage, hasError } = this.props;

    const getTitle = (step: LoadFactorySteps, title: string, iconClass?: string) => {
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
        id: LoadFactorySteps.INITIALIZING,
        name: getTitle(
          LoadFactorySteps.INITIALIZING,
          'Initializing',
          'wizard-icon'),
        canJumpTo: currentStep >= LoadFactorySteps.INITIALIZING,
      },
      {
        name: getTitle(
          LoadFactorySteps.CREATE_WORKSPACE,
          'Creating a workspace',
          'wizard-icon'),
        steps: [
          {
            id: LoadFactorySteps.LOOKING_FOR_DEVFILE,
            name: getTitle(
              LoadFactorySteps.LOOKING_FOR_DEVFILE,
              currentStep <= LoadFactorySteps.LOOKING_FOR_DEVFILE ?
                'Looking for devfile' :
                resolvedDevfileMessage ?
                  `${resolvedDevfileMessage}` :
                  'Devfile could not be found',
            ),
            canJumpTo: currentStep >= LoadFactorySteps.LOOKING_FOR_DEVFILE,
          },
          {
            id: LoadFactorySteps.APPLYING_DEVFILE,
            name: getTitle(
              LoadFactorySteps.APPLYING_DEVFILE,
              'Applying devfile'),
            canJumpTo: currentStep >= LoadFactorySteps.APPLYING_DEVFILE,
          },
        ],
      },
      {
        id: LoadFactorySteps.START_WORKSPACE,
        name: getTitle(
          LoadFactorySteps.START_WORKSPACE,
          'Waiting for workspace to start',
          'wizard-icon'),
        canJumpTo: currentStep >= LoadFactorySteps.START_WORKSPACE,
      },
      {
        id: LoadFactorySteps.OPEN_IDE,
        name: getTitle(
          LoadFactorySteps.OPEN_IDE,
          'Open IDE',
          'wizard-icon'),
        canJumpTo: currentStep >= LoadFactorySteps.OPEN_IDE,
      },
    ];
  }

  public render(): React.ReactElement {
    const {
      workspaceName,
      workspaceId,
      hasError,
      currentStep,
      isDevWorkspace,
    } = this.props;
    const { alertVisible, currentRequestError, currentAlertVariant, alertActionLinks } = this.state;

    return (
      <React.Fragment>
        <Head pageName="Factory Loader" />
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
          status={hasError ? WorkspaceStatus.ERROR : WorkspaceStatus.STARTING} />
        <PageSection variant={SECTION_THEME} className="load-factory-page" isFilled={true}>
          <Tabs activeKey={this.state.activeTabKey} onSelect={this.handleTabClick} inset={{ default: 'insetLg' }}
            id="factory-loader-page-tabs">
            <Tab eventKey={LoadFactoryTabs.Progress} title={LoadFactoryTabs[LoadFactoryTabs.Progress]}
              id="factory-loader-page-wizard-tab">
              <PageSection>
                {(hasError && this.state.currentRequestError) && (
                  <Alert
                    isInline
                    variant={currentAlertVariant}
                    title={currentRequestError}
                    actionClose={<AlertActionCloseButton
                      onClose={() => this.setState({ currentRequestError: '' })} />}
                    actionLinks={alertActionLinks}
                  />
                )}
                <Wizard
                  className="load-factory-wizard"
                  steps={this.getSteps()}
                  ref={this.wizardRef}
                  footer={(<span />)}
                  height={300}
                  startAtStep={currentStep}
                />
              </PageSection>
            </Tab>
            <Tab eventKey={LoadFactoryTabs.Logs} title={LoadFactoryTabs[LoadFactoryTabs.Logs]}
              id="factory-loader-page-logs-tab">
              <WorkspaceLogs
                workspaceId={workspaceId}
                isDevWorkspace={isDevWorkspace}
              />
            </Tab>
          </Tabs>
        </PageSection>
      </React.Fragment>
    );
  }
}

export default FactoryLoader;
