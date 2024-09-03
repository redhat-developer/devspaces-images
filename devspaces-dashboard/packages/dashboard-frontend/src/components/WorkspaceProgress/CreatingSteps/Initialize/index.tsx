/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { helpers } from '@eclipse-che/common';
import { AlertVariant, pluralize } from '@patternfly/react-core';
import isEqual from 'lodash/isEqual';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { generatePath } from 'react-router-dom';

import {
  ProgressStep,
  ProgressStepProps,
  ProgressStepState,
} from '@/components/WorkspaceProgress/ProgressStep';
import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';
import { ROUTE } from '@/Routes/routes';
import { FactoryLocationAdapter } from '@/services/factory-location-adapter';
import {
  buildFactoryParams,
  FactoryParams,
  PoliciesCreate,
} from '@/services/helpers/factoryFlow/buildFactoryParams';
import { buildUserPreferencesLocation, toHref } from '@/services/helpers/location';
import { AlertItem, UserPreferencesTab } from '@/services/helpers/types';
import { AppState } from '@/store';
import { selectAllWorkspacesLimit } from '@/store/ClusterConfig/selectors';
import { selectIsRegistryDevfile } from '@/store/DevfileRegistries/selectors';
import { selectInfrastructureNamespaces } from '@/store/InfrastructureNamespaces/selectors';
import { selectSshKeys } from '@/store/SshKeys/selectors';
import { selectPreferencesIsTrustedSource } from '@/store/Workspaces/Preferences';
import { selectAllWorkspaces } from '@/store/Workspaces/selectors';

export type Props = MappedProps &
  ProgressStepProps & {
    searchParams: URLSearchParams;
  };
export type State = ProgressStepState & {
  factoryParams: FactoryParams;
  isSourceTrusted: boolean;
  isWarning: boolean;
};

class CreatingStepInitialize extends ProgressStep<Props, State> {
  protected readonly name = 'Initializing';

  constructor(props: Props) {
    super(props);

    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
      isSourceTrusted: false,
      name: this.name,
      isWarning: false,
    };
  }

  private init(): void {
    if (this.props.distance !== 0) {
      return;
    }

    if (this.state.lastError) {
      return;
    }

    this.prepareAndRun();
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

    // current step failed
    if (!isEqual(this.state.lastError, nextState.lastError)) {
      return true;
    }

    // source URL trusted/untrusted
    const { sourceUrl } = nextState.factoryParams;
    if (this.state.isSourceTrusted !== this.isSourceTrusted(sourceUrl)) {
      return true;
    }

    // name or warning changed
    if (this.state.name !== nextState.name || this.state.isWarning !== nextState.isWarning) {
      return true;
    }

    return false;
  }

  protected async runStep(): Promise<boolean> {
    const { useDevWorkspaceResources, sourceUrl, errorCode, policiesCreate, remotes } =
      this.state.factoryParams;

    if (useDevWorkspaceResources === true && sourceUrl === '') {
      throw new Error('DevWorkspace resources URL is missing.');
    } else if (useDevWorkspaceResources === false && sourceUrl === '' && !remotes) {
      const factoryPath = generatePath(ROUTE.FACTORY_LOADER_URL, {
        url: 'your-repository-url',
      });
      throw new Error(
        `Repository/Devfile URL is missing. Please specify it via url query param: ${window.location.origin}${window.location.pathname}#${factoryPath}`,
      );
    }

    // skip source validation for devworkspace resources (samples)
    if (useDevWorkspaceResources === false) {
      // check if the source is trusted
      const isSourceTrusted = this.isSourceTrusted(sourceUrl);
      if (isSourceTrusted === true) {
        this.setState({
          isSourceTrusted,
          isWarning: false,
          name: this.name,
        });
      } else {
        this.setState({
          isSourceTrusted,
          isWarning: true,
          name: 'Warning: untrusted source',
        });
        return false;
      }
    }

    // find error codes
    if (errorCode === 'invalid_request') {
      throw new Error(
        'Could not resolve devfile from private repository because authentication request is missing a parameter, contains an invalid parameter, includes a parameter more than once, or is otherwise invalid.',
      );
    } else if (errorCode === 'ssl_exception') {
      throw new Error('SSL handshake failed. Please, contact the cluster administrator.');
    }

    // validate creation policies
    if (this.isCreatePolicy(policiesCreate) === false) {
      throw new Error(
        `Unsupported create policy "${policiesCreate}" is specified while the only following are supported: peruser, perclick. Please fix "policies.create" parameter and try again.`,
      );
    }

    // check for a pre-created infrastructure namespace
    const namespaces = this.props.infrastructureNamespaces;
    if (namespaces.length === 0 || (namespaces.length === 1 && !namespaces[0].attributes.phase)) {
      throw new Error(
        'Failed to create a workspace. The infrastructure namespace is required to be created. Please, contact the cluster administrator.',
      );
    }

    // check for SSH keys availability
    if (FactoryLocationAdapter.isSshLocation(sourceUrl) && this.props.sshKeys.length === 0) {
      throw new NoSshKeysError('No SSH keys found.');
    }

    this.checkAllWorkspacesLimitExceeded();

    return true;
  }

  private isCreatePolicy(val: string): val is PoliciesCreate {
    return (val && (val as PoliciesCreate) === 'perclick') || (val as PoliciesCreate) === 'peruser';
  }

  private handleRestart(): void {
    window.location.reload();
  }

  private handleOpenUserPreferences(): void {
    const location = buildUserPreferencesLocation(UserPreferencesTab.SSH_KEYS);
    const link = toHref(this.props.history, location);
    window.open(link, '_blank');
  }

  protected buildAlertItem(error: Error): AlertItem {
    const key = this.name;

    if (error instanceof NoSshKeysError) {
      return {
        key,
        title: 'No SSH keys found',
        variant: AlertVariant.warning,
        children: 'No SSH keys found. Please add your SSH keys and then try again.',
        actionCallbacks: [
          {
            title: 'Click to try again',
            callback: () => this.handleRestart(),
          },
          {
            title: 'Add SSH Keys',
            callback: () => this.handleOpenUserPreferences(),
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
          title: 'Click to try again',
          callback: () => this.handleRestart(),
        },
      ],
    };
  }

  private checkAllWorkspacesLimitExceeded() {
    if (
      this.props.allWorkspacesLimit !== -1 &&
      this.props.allWorkspaces.length >= this.props.allWorkspacesLimit
    ) {
      const number = this.props.allWorkspacesLimit;
      const message = `You can only keep ${pluralize(number, 'workspace')}.`;
      throw new AllWorkspacesExceededError(message);
    }
  }

  private isSourceTrusted(sourceUrl: string): boolean {
    const isTrustedSource = this.props.isTrustedSource(sourceUrl);
    const isRegistryDevfile = this.props.isRegistryDevfile(sourceUrl);
    if (isRegistryDevfile || isTrustedSource) {
      return true;
    }
    return false;
  }

  render(): React.ReactElement {
    const { distance, hasChildren } = this.props;
    const { name, lastError } = this.state;

    let isError = lastError !== undefined;
    let isWarning = false;
    if (lastError instanceof NoSshKeysError || this.state.isWarning) {
      isWarning = true;
      isError = false;
    }

    return (
      <ProgressStepTitle
        distance={distance}
        hasChildren={hasChildren}
        isError={isError}
        isWarning={isWarning}
      >
        {name}
      </ProgressStepTitle>
    );
  }
}

export class AllWorkspacesExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AllWorkspacesExceededError';
  }
}

export class NoSshKeysError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoSshKeysError';
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  allWorkspacesLimit: selectAllWorkspacesLimit(state),
  infrastructureNamespaces: selectInfrastructureNamespaces(state),
  isRegistryDevfile: selectIsRegistryDevfile(state),
  isTrustedSource: selectPreferencesIsTrustedSource(state),
  sshKeys: selectSshKeys(state),
});

const connector = connect(mapStateToProps, {}, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(CreatingStepInitialize);
