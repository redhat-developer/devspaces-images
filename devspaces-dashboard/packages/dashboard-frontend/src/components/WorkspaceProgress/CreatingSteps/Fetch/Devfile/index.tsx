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

import common, { FACTORY_LINK_ATTR, helpers } from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import { isEqual } from 'lodash';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import ExpandableWarning from '@/components/ExpandableWarning';
import { TIMEOUT_TO_RESOLVE_SEC } from '@/components/WorkspaceProgress/const';
import { buildStepName } from '@/components/WorkspaceProgress/CreatingSteps/Fetch/Devfile/buildStepName';
import {
  ProgressStep,
  ProgressStepProps,
  ProgressStepState,
} from '@/components/WorkspaceProgress/ProgressStep';
import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';
import { TimeLimit } from '@/components/WorkspaceProgress/TimeLimit';
import {
  buildFactoryParams,
  FactoryParams,
  USE_DEFAULT_DEVFILE,
} from '@/services/helpers/factoryFlow/buildFactoryParams';
import { AlertItem } from '@/services/helpers/types';
import OAuthService, { isOAuthResponse } from '@/services/oauth';
import SessionStorageService, { SessionStorageKey } from '@/services/session-storage';
import { AppState } from '@/store';
import * as FactoryResolverStore from '@/store/FactoryResolver';
import {
  selectFactoryResolver,
  selectFactoryResolverConverted,
} from '@/store/FactoryResolver/selectors';
import { selectAllWorkspaces } from '@/store/Workspaces/selectors';

export class ApplyingDevfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApplyingDevfileError';
  }
}

export class UnsupportedGitProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedGitProviderError';
  }
}

const RELOADS_LIMIT = 2;
type ReloadsInfo = {
  [url: string]: number;
};

export type Props = MappedProps &
  ProgressStepProps & {
    searchParams: URLSearchParams;
  };
export type State = ProgressStepState & {
  factoryParams: FactoryParams;
  shouldResolve: boolean;
  useDefaultDevfile: boolean;
};

class CreatingStepFetchDevfile extends ProgressStep<Props, State> {
  protected readonly name = 'Inspecting repo';

  constructor(props: Props) {
    super(props);

    const factoryParams = buildFactoryParams(props.searchParams);
    const name = `Inspecting repo ${factoryParams.sourceUrl} for a devfile`;

    this.state = {
      factoryParams,
      shouldResolve: true,
      useDefaultDevfile: false,
      name,
    };
  }

  public componentDidMount() {
    this.init();
  }

  public componentDidUpdate() {
    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // active step changed
    if (this.props.distance !== nextProps.distance) {
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

    // an error occurred or cleared
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
    if (this.props.distance) {
      return;
    }

    if (this.state.lastError) {
      return;
    }

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

  protected handleRestart(alertKey: string): void {
    const searchParams = new URLSearchParams(this.props.history.location.search);
    searchParams.delete(USE_DEFAULT_DEVFILE);
    this.props.history.location.search = searchParams.toString();
    this.props.onHideError(alertKey);

    this.setState({
      shouldResolve: true,
    });
    this.clearStepError();
    this.props.onRestart();
  }

  private handleDefaultDevfile(alertKey: string): void {
    const searchParams = new URLSearchParams(this.props.history.location.search);
    searchParams.set(USE_DEFAULT_DEVFILE, 'true');
    this.props.history.location.search = searchParams.toString();
    this.props.onHideError(alertKey);

    this.setState({
      useDefaultDevfile: true,
    });
    this.clearStepError();
  }

  protected handleTimeout(): void {
    const timeoutError = new Error(
      `Devfile hasn't been resolved in the last ${TIMEOUT_TO_RESOLVE_SEC} seconds.`,
    );
    this.handleError(timeoutError);
  }

  protected async runStep(): Promise<boolean> {
    const { factoryParams, shouldResolve, useDefaultDevfile } = this.state;
    const { factoryResolver, factoryResolverConverted } = this.props;
    const { sourceUrl } = factoryParams;

    if (
      factoryResolver?.location === sourceUrl &&
      factoryResolverConverted?.devfileV2 !== undefined
    ) {
      // the devfile resolved successfully
      const newName = buildStepName(sourceUrl, factoryResolver, factoryResolverConverted);
      this.setState({
        name: newName,
      });

      return true;
    }

    if (shouldResolve === false && useDefaultDevfile) {
      // go to the next step
      return true;
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
    return false;
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

        /* open authentication page */

        const redirectUrl = new URL('/f', window.location.origin);
        redirectUrl.searchParams.set(
          FACTORY_LINK_ATTR,
          this.props.history.location.search.replace(/^\?/, ''),
        );

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

  protected buildAlertItem(error: Error): AlertItem {
    const key = this.name;

    if (error instanceof ApplyingDevfileError) {
      return {
        key,
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
            title: 'Continue with default devfile',
            callback: () => this.handleDefaultDevfile(key),
          },
          {
            title: 'Reload',
            callback: () => this.handleRestart(key),
          },
        ],
      };
    }
    if (error instanceof UnsupportedGitProviderError) {
      return {
        key,
        title: 'Warning',
        variant: AlertVariant.warning,
        children: (
          <ExpandableWarning
            textBefore="Could not find any devfile in the Git repository"
            errorMessage={helpers.errors.getMessage(error)}
            textAfter="The Git provider is not supported."
          />
        ),
        actionCallbacks: [
          {
            title: 'Continue with default devfile',
            callback: () => this.handleDefaultDevfile(key),
          },
          {
            title: 'Reload',
            callback: () => this.handleRestart(key),
          },
        ],
      };
    }
    return {
      key,
      title: 'Failed to create the workspace',
      variant: AlertVariant.danger,
      children: helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Continue with default devfile',
          callback: () => this.handleDefaultDevfile(key),
        },
        {
          title: 'Click to try again',
          callback: () => this.handleRestart(key),
        },
      ],
    };
  }

  private setReloadsInfo(reloads: ReloadsInfo): void {
    const strReloads = JSON.stringify(reloads);
    SessionStorageService.update(SessionStorageKey.PRIVATE_FACTORY_RELOADS, strReloads);
  }

  render(): React.ReactElement {
    const { distance, hasChildren } = this.props;
    const { name, lastError } = this.state;

    const isActive = distance === 0;
    const isError = lastError !== undefined;
    const isWarning = false;

    return (
      <React.Fragment>
        {isActive && (
          <TimeLimit timeLimitSec={TIMEOUT_TO_RESOLVE_SEC} onTimeout={() => this.handleTimeout()} />
        )}
        <ProgressStepTitle
          distance={distance}
          hasChildren={hasChildren}
          isError={isError}
          isWarning={isWarning}
        >
          {name}
        </ProgressStepTitle>
      </React.Fragment>
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
export default connector(CreatingStepFetchDevfile);
