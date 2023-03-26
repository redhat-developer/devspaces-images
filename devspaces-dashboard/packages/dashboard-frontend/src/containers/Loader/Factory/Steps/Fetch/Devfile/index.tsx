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

import common, { helpers } from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import { isEqual } from 'lodash';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import ExpandableWarning from '../../../../../../components/ExpandableWarning';
import { LoaderPage } from '../../../../../../pages/Loader';
import { delay } from '../../../../../../services/helpers/delay';
import { DisposableCollection } from '../../../../../../services/helpers/disposable';
import { getEnvironment, isDevEnvironment } from '../../../../../../services/helpers/environment';
import { AlertItem } from '../../../../../../services/helpers/types';
import OAuthService, { isOAuthResponse } from '../../../../../../services/oauth';
import SessionStorageService, {
  SessionStorageKey,
} from '../../../../../../services/session-storage';
import { AppState } from '../../../../../../store';
import * as FactoryResolverStore from '../../../../../../store/FactoryResolver';
import {
  selectFactoryResolver,
  selectFactoryResolverConverted,
} from '../../../../../../store/FactoryResolver/selectors';
import { selectAllWorkspaces } from '../../../../../../store/Workspaces/selectors';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../../../AbstractStep';
import { buildFactoryParams, FactoryParams } from '../../../../buildFactoryParams';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_RESOLVE_SEC } from '../../../../const';
import buildStepTitle from './buildStepTitle';

export class ApplyingDevfileError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApplyingDevfileError';
  }
}

export class UnsupportedGitProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnsupportedGitProviderError';
  }
}

const RELOADS_LIMIT = 2;
type ReloadsInfo = {
  [url: string]: number;
};

export type Props = MappedProps &
  LoaderStepProps & {
    searchParams: URLSearchParams;
  };
export type State = LoaderStepState & {
  factoryParams: FactoryParams;
  shouldResolve: boolean;
  useDefaultDevfile: boolean;
};

class StepFetchDevfile extends AbstractLoaderStep<Props, State> {
  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
      shouldResolve: true,
      useDefaultDevfile: false,
    };
  }

  public componentDidMount() {
    this.init();
  }

  public componentDidUpdate() {
    this.toDispose.dispose();

    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // switch to the next step
    if (this.props.currentStepIndex !== nextProps.currentStepIndex) {
      return true;
    }

    // factory resolver got updated
    const { sourceUrl } = this.state.factoryParams;
    if (
      sourceUrl &&
      this.props.factoryResolver?.location !== sourceUrl &&
      nextProps.factoryResolver?.location === sourceUrl
    ) {
      return true;
    }

    // current step failed
    if (!isEqual(this.state.lastError, nextState.lastError)) {
      return true;
    }

    if (this.state.shouldResolve !== nextState.shouldResolve) {
      return true;
    }
    return false;
  }

  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  private init() {
    const { factoryResolver } = this.props;
    const { factoryParams, useDefaultDevfile } = this.state;
    const { sourceUrl, remotes } = factoryParams;
    if (sourceUrl && (useDefaultDevfile || sourceUrl === factoryResolver?.location)) {
      // prevent a resource being fetched one more time
      this.setState({
        shouldResolve: false,
      });
    }

    // make it possible to start a workspace without a sourceUrl as long as
    // remotes are specified
    if (!sourceUrl && remotes) {
      this.setState({
        shouldResolve: false,
        useDefaultDevfile: true,
      });
    }

    this.prepareAndRun();
  }

  protected handleRestart(): void {
    this.setState({
      shouldResolve: true,
    });
    this.clearStepError();
    this.props.onRestart();
  }

  protected async runStep(): Promise<boolean> {
    await delay(MIN_STEP_DURATION_MS);

    const { factoryParams, shouldResolve, useDefaultDevfile } = this.state;
    const { currentStepIndex, factoryResolver, factoryResolverConverted, loaderSteps } = this.props;
    const { sourceUrl } = factoryParams;

    if (
      factoryResolver?.location === sourceUrl &&
      factoryResolverConverted?.devfileV2 !== undefined
    ) {
      // the devfile resolved successfully

      // update step title
      const currentStep = loaderSteps.get(currentStepIndex).value;
      const newTitle = buildStepTitle(sourceUrl, factoryResolver, factoryResolverConverted);
      if (newTitle !== currentStep.title) {
        currentStep.title = newTitle;
        this.forceUpdate();
      }

      return true;
    }

    if (shouldResolve === false) {
      if (useDefaultDevfile) {
        // go to the next step
        return true;
      }

      if (this.state.lastError instanceof Error) {
        throw this.state.lastError;
      }
      throw new Error('Failed to resolve the devfile.');
    }

    let resolveDone = false;
    try {
      // start resolving the devfile
      resolveDone = await this.resolveDevfile(sourceUrl);
    } catch (e) {
      const errorMessage = common.helpers.errors.getMessage(e);
      // check if it is a scheme validation error
      if (errorMessage.includes('schema validation failed')) {
        throw new ApplyingDevfileError(errorMessage);
      }
      if (errorMessage === 'Failed to fetch devfile') {
        throw new UnsupportedGitProviderError(errorMessage);
      }
      throw e;
    }
    if (!resolveDone) {
      return false;
    }

    // wait for the devfile resolving to complete
    try {
      await this.waitForStepDone(TIMEOUT_TO_RESOLVE_SEC);

      // do not switch to the next step
      return false;
    } catch (e) {
      throw new Error(
        `Devfile hasn't been resolved in the last ${TIMEOUT_TO_RESOLVE_SEC} seconds.`,
      );
    }
  }

  private handleDevfileError(): void {
    this.setState({
      useDefaultDevfile: true,
    });
    this.clearStepError();
  }

  /**
   * Resolves promise with `true` if devfile resolved successfully. Resolves promise with `false` if the devfile needs to be resolved one more time after authentication.
   */
  private async resolveDevfile(factoryUrl: string): Promise<boolean> {
    const { factoryParams } = this.state;

    try {
      await this.props.requestFactoryResolver(factoryUrl, factoryParams);
      this.clearNumberOfTries();
      return true;
    } catch (e) {
      if (isOAuthResponse(e)) {
        this.checkNumberOfTries(factoryUrl);
        this.increaseNumberOfTries(factoryUrl);

        // open authentication page
        const env = getEnvironment();
        // build redirect URL
        let redirectHost = window.location.protocol + '//' + window.location.host;
        if (isDevEnvironment(env)) {
          redirectHost = env.server;
        }
        const redirectUrl = new URL('/f', redirectHost);
        redirectUrl.searchParams.set('url', factoryUrl);
        OAuthService.openOAuthPage(e.attributes.oauth_authentication_url, redirectUrl.toString());
        return false;
      }

      throw e;
    }
  }

  /**
   * Checks if page reloads number for given private repo URL is less than the limit.
   * Returns if reloads limit is not reached yet. Otherwise, throws.
   */
  private checkNumberOfTries(factoryUrl: string): void {
    // check how many times this factory was tried to be resolved.
    // if the number of tries is too high that may be the infinite reloading loop. Show alert notification and ask user to take an action.
    const reloadsNumber = this.getNumberOfTries(factoryUrl);
    if (reloadsNumber < RELOADS_LIMIT) {
      return;
    }

    throw new Error(
      'The Dashboard reached a limit of reloads while trying to resolve a devfile in a private repo. Please contact admin to check if OAuth is configured correctly.',
    );
  }

  private getNumberOfTries(location: string): number {
    const reloads = this.getReloadsInfo();
    return reloads[location] || 0;
  }

  private increaseNumberOfTries(location: string): void {
    const reloads = this.getReloadsInfo();
    if (!reloads[location]) {
      reloads[location] = 0;
    }
    reloads[location]++;
    this.setReloadsInfo(reloads);
  }

  private clearNumberOfTries(): void {
    const reloads = {};
    this.setReloadsInfo(reloads);
  }

  private getReloadsInfo(): ReloadsInfo {
    const strReloads = SessionStorageService.get(SessionStorageKey.PRIVATE_FACTORY_RELOADS);
    if (!strReloads) {
      return {};
    }
    try {
      return JSON.parse(strReloads);
    } catch (e) {
      return {};
    }
  }

  private getAlertItem(error: unknown): AlertItem | undefined {
    if (error instanceof ApplyingDevfileError) {
      return {
        key: 'factory-loader-devfile-error',
        title: 'Warning',
        variant: AlertVariant.warning,
        children: (
          <ExpandableWarning
            textBefore="The Devfile in the git repository is invalid:"
            errorMessage={helpers.errors.getMessage(error)}
            textAfter="If you continue it will be ignored and a regular workspace will be created.
            You will have a chance to fix the Devfile from the IDE once it is started."
          />
        ),
        actionCallbacks: [
          {
            title: 'Continue with the default devfile',
            callback: () => this.handleDevfileError(),
          },
          {
            title: 'Reload',
            callback: () => this.clearStepError(),
          },
        ],
      };
    }
    if (error instanceof UnsupportedGitProviderError) {
      return {
        key: 'factory-loader-devfile-error',
        title: 'Warning',
        variant: AlertVariant.warning,
        children: (
          <ExpandableWarning
            textBefore="Looking for a Devfile in the git repository failed."
            errorMessage={helpers.errors.getMessage(error)}
            textAfter="The git provider may not be supported by Eclipse Che (or the git server hasn't been configured
            appropriately). Note that the git cloning of the repository will succeed if it's public or it's private
            and the developer git credentials secret has been configured."
          />
        ),
        actionCallbacks: [
          {
            title: 'Continue with the default devfile',
            callback: () => this.handleDevfileError(),
          },
          {
            title: 'Reload',
            callback: () => this.clearStepError(),
          },
        ],
      };
    }
    if (!error) {
      return;
    }
    return {
      key: 'factory-loader-apply-resources',
      title: 'Failed to create the workspace',
      variant: AlertVariant.danger,
      children: helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Click to try again',
          callback: () => this.handleRestart(),
        },
      ],
    };
  }

  private setReloadsInfo(reloads: ReloadsInfo): void {
    const strReloads = JSON.stringify(reloads);
    SessionStorageService.update(SessionStorageKey.PRIVATE_FACTORY_RELOADS, strReloads);
  }

  render(): React.ReactElement {
    const { currentStepIndex, loaderSteps, tabParam } = this.props;
    const { lastError } = this.state;

    const steps = loaderSteps.values;
    const currentStepId = loaderSteps.get(currentStepIndex).value.id;

    const alertItem = this.getAlertItem(lastError);

    return (
      <LoaderPage
        alertItem={alertItem}
        currentStepId={currentStepId}
        steps={steps}
        tabParam={tabParam}
        workspace={undefined}
        onTabChange={tab => this.handleTabChange(tab)}
      />
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  factoryResolver: selectFactoryResolver(state),
  factoryResolverConverted: selectFactoryResolverConverted(state),
});

const connector = connect(
  mapStateToProps,
  {
    ...FactoryResolverStore.actionCreators,
  },
  null,
  {
    // forwardRef is mandatory for using `@react-mock/state` in unit tests
    forwardRef: true,
  },
);
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StepFetchDevfile);
