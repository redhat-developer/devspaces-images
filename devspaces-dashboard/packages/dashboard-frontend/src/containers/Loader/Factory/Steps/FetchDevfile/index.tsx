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
import { connect, ConnectedProps } from 'react-redux';
import { isEqual } from 'lodash';
import { helpers } from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import { AppState } from '../../../../../store';
import * as FactoryResolverStore from '../../../../../store/FactoryResolver';
import { DisposableCollection } from '../../../../../services/helpers/disposable';
import { selectAllWorkspaces } from '../../../../../store/Workspaces/selectors';
import { delay } from '../../../../../services/helpers/delay';
import { FactoryLoaderPage } from '../../../../../pages/Loader/Factory';
import { isOAuthResponse } from '../../../../../store/FactoryResolver';
import { getEnvironment, isDevEnvironment } from '../../../../../services/helpers/environment';
import SessionStorageService, { SessionStorageKey } from '../../../../../services/session-storage';
import {
  selectFactoryResolver,
  selectFactoryResolverConverted,
} from '../../../../../store/FactoryResolver/selectors';
import { findTargetWorkspace } from '../findTargetWorkspace';
import buildStepTitle from './buildStepTitle';
import { Workspace } from '../../../../../services/workspace-adapter';
import { FactoryParams } from '../../types';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_RESOLVE_SEC } from '../../../const';
import buildFactoryParams from '../../buildFactoryParams';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../../AbstractStep';

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
};

class StepFetchDevfile extends AbstractLoaderStep<Props, State> {
  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
      shouldResolve: true,
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
    const workspace = this.findTargetWorkspace(this.props, this.state);
    const nextWorkspace = this.findTargetWorkspace(nextProps, nextState);

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

    // new workspace appeared
    if (workspace === undefined && nextWorkspace !== undefined) {
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
    const workspace = this.findTargetWorkspace(this.props, this.state);
    if (workspace) {
      // prevent a resource being fetched one more time
      this.setState({
        shouldResolve: false,
      });
    }

    const { factoryResolver } = this.props;
    const { factoryParams } = this.state;
    const { sourceUrl } = factoryParams;
    if (sourceUrl && sourceUrl === factoryResolver?.location) {
      this.setState({
        shouldResolve: false,
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

    const { factoryParams, shouldResolve } = this.state;
    const { currentStepIndex, factoryResolver, factoryResolverConverted, loaderSteps } = this.props;
    const { sourceUrl } = factoryParams;

    const workspace = this.findTargetWorkspace(this.props, this.state);
    if (workspace) {
      // the workspace has been created, go to the next step
      return true;
    }

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
      if (this.state.lastError instanceof Error) {
        throw this.state.lastError;
      }
      throw new Error('Failed to resolve the devfile.');
    }

    // start resolving the devfile
    const resolveDone = await this.resolveDevfile(sourceUrl);
    if (resolveDone === false) {
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

  private findTargetWorkspace(props: Props, state: State): Workspace | undefined {
    return findTargetWorkspace(
      props.allWorkspaces,
      state.factoryParams.factoryId,
      state.factoryParams.policiesCreate,
    );
  }

  /**
   * Resolves promise with `true` if devfile resolved successfully. Resolves promise with `false` if the devfile needs to be resolved one more time after authentication.
   */
  private async resolveDevfile(factoryUrl: string): Promise<boolean> {
    const { factoryParams } = this.state;
    const params = Object.assign({}, factoryParams.overrides, {
      error_code: factoryParams.errorCode,
    });

    try {
      await this.props.requestFactoryResolver(factoryUrl, params);
      this.clearNumberOfTries();
      return true;
    } catch (e) {
      if (isOAuthResponse(e)) {
        this.checkNumberOfTries(factoryUrl);
        this.increaseNumberOfTries(factoryUrl);

        // open authentication page
        this.openAuthPage(e.attributes.oauth_authentication_url, factoryUrl);
        return false;
      }

      throw e;
    }
  }

  private openAuthPage(oauthUrl: string, factoryUrl: string): void {
    try {
      const env = getEnvironment();
      // build redirect URL
      let redirectHost = window.location.protocol + '//' + window.location.host;
      if (isDevEnvironment(env)) {
        redirectHost = env.server;
      }
      const redirectUrl = new URL('/f', redirectHost);
      redirectUrl.searchParams.set('url', factoryUrl);

      const oauthUrlTmp = new window.URL(oauthUrl);
      const fullOauthUrl =
        oauthUrlTmp.toString() + '&redirect_after_login=' + redirectUrl.toString();
      window.location.href = fullOauthUrl;
    } catch (e) {
      throw new Error(`Failed to open authentication page. ${helpers.errors.getMessage(e)}`);
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

  private setReloadsInfo(reloads: ReloadsInfo): void {
    const strReloads = JSON.stringify(reloads);
    SessionStorageService.update(SessionStorageKey.PRIVATE_FACTORY_RELOADS, strReloads);
  }

  render(): React.ReactElement {
    const { currentStepIndex, loaderSteps, tabParam } = this.props;
    const { lastError } = this.state;

    const steps = loaderSteps.values;
    const currentStepId = loaderSteps.get(currentStepIndex).value.id;

    const alertItem =
      lastError === undefined
        ? undefined
        : {
            key: 'factory-loader-fetch-devfile',
            title: 'Failed to create the workspace',
            variant: AlertVariant.danger,
            children: helpers.errors.getMessage(lastError),
          };

    return (
      <FactoryLoaderPage
        alertItem={alertItem}
        currentStepId={currentStepId}
        steps={steps}
        tabParam={tabParam}
        onRestart={() => this.handleRestart()}
      />
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  factoryResolver: selectFactoryResolver(state),
  factoryResolverConverted: selectFactoryResolverConverted(state),
});

const connector = connect(mapStateToProps, {
  ...FactoryResolverStore.actionCreators,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StepFetchDevfile);
