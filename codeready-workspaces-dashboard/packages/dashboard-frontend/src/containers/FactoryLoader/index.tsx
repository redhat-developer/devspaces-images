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
import axios from 'axios';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { History } from 'history';
import common from '@eclipse-che/common';
import { delay } from '../../services/helpers/delay';
import { AppState } from '../../store';
import * as FactoryResolverStore from '../../store/FactoryResolver';
import * as WorkspacesStore from '../../store/Workspaces';
import * as DevWorkspacesStore from '../../store/Workspaces/devWorkspaces';
import FactoryLoader from '../../pages/FactoryLoader';
import {
  selectAllWorkspaces,
  selectWorkspaceById,
  selectWorkspaceByQualifiedName,
} from '../../store/Workspaces/selectors';
import {
  selectDevworkspacesEnabled,
  selectPreferredStorageType,
  selectWorkspacesSettings,
} from '../../store/Workspaces/Settings/selectors';
import { buildIdeLoaderLocation, sanitizeLocation } from '../../services/helpers/location';
import { lazyInject } from '../../inversify.config';
import { KeycloakAuthService } from '../../services/keycloak/auth';
import { getEnvironment, isDevEnvironment } from '../../services/helpers/environment';
import { isOAuthResponse } from '../../store/FactoryResolver';
import { Devfile, isCheDevfile, isCheWorkspace, Workspace } from '../../services/workspace-adapter';
import { AlertOptions } from '../../pages/FactoryLoader';
import {
  selectDefaultNamespace,
  selectInfrastructureNamespaces,
} from '../../store/InfrastructureNamespaces/selectors';
import { safeLoad, safeLoadAll } from 'js-yaml';
import updateDevfileMetadata, { FactorySource } from './updateDevfileMetadata';
import { DEVWORKSPACE_DEVFILE_SOURCE } from '../../services/workspace-client/devworkspace/devWorkspaceClient';
import devfileApi from '../../services/devfileApi';
import getRandomString from '../../services/helpers/random';
import { isDevworkspacesEnabled } from '../../services/helpers/devworkspace';

const WS_ATTRIBUTES_TO_SAVE: string[] = [
  'workspaceDeploymentLabels',
  'workspaceDeploymentAnnotations',
  'policies.create',
  'che-editor',
  'devWorkspace',
];

export type CreatePolicy = 'perclick' | 'peruser';

enum ErrorCodes {
  INVALID_REQUEST = 'invalid_request',
  ACCESS_DENIED = 'access_denied',
}

export enum LoadFactorySteps {
  INITIALIZING = 0,
  CREATE_WORKSPACE = 1,
  LOOKING_FOR_DEVFILE,
  APPLYING_DEVFILE,
  START_WORKSPACE,
  OPEN_IDE,
}

type Props = MappedProps & { history: History };

type State = {
  search?: string;
  location?: string;
  resolvedDevfileMessage?: string;
  currentStep: LoadFactorySteps;
  hasError: boolean;
  createPolicy: CreatePolicy;
  cheDevworkspaceEnabled: boolean;
  createFromDevfile: boolean; // indicates that a devfile is used to create a workspace
};

export class FactoryLoaderContainer extends React.PureComponent<Props, State> {
  private factoryLoaderCallbacks: { showAlert?: (options: AlertOptions) => void } = {};
  private factoryResolver: FactoryResolverStore.State;
  private overrideDevfileObject: {
    [params: string]: string;
  } = {};

  @lazyInject(KeycloakAuthService)
  private readonly keycloakAuthService: KeycloakAuthService;

  constructor(props: Props) {
    super(props);

    const { search } = this.props.history.location;
    const cheDevworkspaceEnabled = isDevworkspacesEnabled(this.props.workspacesSettings);
    const createPolicy = this.getDefaultCreatePolicy();
    this.state = {
      currentStep: LoadFactorySteps.INITIALIZING,
      hasError: false,
      createPolicy,
      search,
      cheDevworkspaceEnabled,
      createFromDevfile: false,
    };
  }

  private getDefaultCreatePolicy(): CreatePolicy {
    const devWorkspaceMode = isDevworkspacesEnabled(this.props.workspacesSettings);
    return devWorkspaceMode ? 'peruser' : 'perclick';
  }

  private resetOverrideParams(): void {
    this.overrideDevfileObject = {};
  }

  private updateOverrideParams(key: string, val: string): void {
    this.overrideDevfileObject[key] = val;
  }

  public showAlert(alertOptions: string | AlertOptions): void {
    if (typeof alertOptions === 'string') {
      const currentAlertOptions = alertOptions;
      alertOptions = {
        title: currentAlertOptions,
        alertVariant: AlertVariant.danger,
      } as AlertOptions;
    }
    if (alertOptions.alertVariant === AlertVariant.danger) {
      this.setState({ hasError: true });
    }
    if (this.factoryLoaderCallbacks.showAlert) {
      this.factoryLoaderCallbacks.showAlert(alertOptions);
    } else {
      console.error(alertOptions.title);
    }
  }

  private showOnlyContentIfDevWorkspace(): void {
    if (this.state.cheDevworkspaceEnabled) {
      // hide all bars
      window.postMessage('hide-allbar', '*');
    }
  }

  public componentDidMount(): void {
    this.showOnlyContentIfDevWorkspace();
    this.createWorkspaceFromFactory();
  }

  public async componentDidUpdate(): Promise<void> {
    this.showOnlyContentIfDevWorkspace();

    const { history, workspace, factoryResolver } = this.props;
    if (this.state.search !== history.location.search) {
      this.setState({
        search: history.location.search,
        hasError: false,
      });
      return this.createWorkspaceFromFactory();
    }

    if (factoryResolver) {
      this.factoryResolver = factoryResolver;
    }

    if (
      this.state.currentStep === LoadFactorySteps.START_WORKSPACE &&
      workspace &&
      workspace.isRunning
    ) {
      await this.openIde();
    }
    if (workspace && workspace.hasError && !this.state.hasError) {
      const errorMessage =
        (workspace.isDevWorkspace && (workspace.ref as devfileApi.DevWorkspace)?.status?.message) ||
        'Unknown workspace error.';
      this.showAlert(errorMessage);
    }
  }

  private async openIde(): Promise<void> {
    const { history, workspace } = this.props;
    if (!workspace || !workspace.isRunning) {
      return;
    }
    this.setState({ currentStep: LoadFactorySteps.OPEN_IDE });
    try {
      await this.props.requestWorkspace(workspace);
    } catch (e) {
      this.showAlert(`Getting workspace detail data failed. ${e}`);
    }
    await delay();
    history.push(buildIdeLoaderLocation(workspace));
  }

  private isCreatePolicy(val: string): val is CreatePolicy {
    return (val && (val as CreatePolicy) === 'perclick') || (val as CreatePolicy) === 'peruser';
  }

  private getCreatePolicy(attrs: { [key: string]: string }): CreatePolicy | undefined {
    const policy = attrs['policies.create'] || this.getDefaultCreatePolicy();
    if (this.isCreatePolicy(policy)) {
      return policy;
    }
    this.showAlert(
      `Unsupported create policy '${policy}' is specified while the only following are supported: peruser, perclick. Please fix 'policies.create' parameter and try again.`,
    );
    return undefined;
  }

  private clearOldData(): void {
    if (this.props.workspace) {
      this.props.clearWorkspaceId();
    }
    this.resetOverrideParams();
    this.setState({ hasError: false });
  }

  private getSearchParam(): string | undefined {
    const { location: dirtyLocation } = this.props.history;
    const { search } = sanitizeLocation(dirtyLocation);
    if (!search) {
      this.showAlert(
        `Repository/Devfile URL is missing. Please specify it via url query param: ${window.location.origin}${window.location.pathname}#/load-factory?url= .`,
      );
    }
    return search;
  }

  private getErrorCode(search: string): string | undefined {
    const searchParam = new window.URLSearchParams(search);
    const errorCode = searchParam.get('error_code');
    if (!errorCode) {
      return;
    }
    return errorCode;
  }

  private getLocation(search: string): string | undefined {
    const searchParam = new window.URLSearchParams(search);
    const location = searchParam.get('url');
    if (!location) {
      this.showAlert(
        `Repository/Devfile URL is missing. Please specify it via url query param: ${window.location.origin}${window.location.pathname}#/load-factory?url= .`,
      );
      return;
    }
    return location;
  }

  private getAttributes(location: string, search: string): { [key: string]: string } {
    const url = 'url';
    const searchParam = new window.URLSearchParams(search);
    searchParam.sort();
    // set devfile attributes
    const attrs: { [key: string]: string } = {};
    const factoryParams = new window.URLSearchParams(`${url}=${location}`);
    searchParam.forEach((val: string, key: string) => {
      if (key === url) {
        return;
      }
      if (WS_ATTRIBUTES_TO_SAVE.indexOf(key) !== -1) {
        attrs[key] = val;
        factoryParams.append(key, val);
      }
      if (key.startsWith('override.')) {
        this.updateOverrideParams(key, val);
        factoryParams.append(key, val);
      }
    });

    attrs.factoryParams = window.decodeURIComponent(factoryParams.toString());

    return attrs;
  }

  private async resolveDevfile(location: string): Promise<Devfile | undefined> {
    const override = Object.entries(this.overrideDevfileObject).length
      ? this.overrideDevfileObject
      : undefined;
    try {
      await this.props.requestFactoryResolver(location, override);
    } catch (e) {
      if (isOAuthResponse(e)) {
        this.resolvePrivateDevfile(e.attributes.oauth_authentication_url, location);
        return;
      }
      this.showAlert(`Failed to resolve a devfile. ${common.helpers.errors.getMessage(e)}`);
      return;
    }
    if (this.factoryResolver.resolver?.location !== location) {
      this.showAlert('Failed to resolve a devfile.');
      return;
    }
    const { source } = this.factoryResolver.resolver;
    const searchParam = new window.URLSearchParams(this.state.search);

    const devfile = this.factoryResolver.resolver.devfile;
    let resolvedDevfileMessage: string;
    // source tells where devfile comes from
    //  - no source: the url to raw content is used
    //  - repo: means no devfile is found and default is generated
    //  - any other - devfile is found in repository as filename from the value
    if (!source) {
      resolvedDevfileMessage = `Devfile loaded from ${searchParam.get('url')}.`;
    } else if (source === 'repo') {
      resolvedDevfileMessage = `Devfile could not be found in ${searchParam.get(
        'url',
      )}. Applying the default configuration.`;
    } else {
      resolvedDevfileMessage = `Devfile found in repo ${searchParam.get('url')} as '${source}'.`;
    }

    if (this.factoryResolver.converted?.isConverted && source !== 'repo') {
      console.debug(
        'Resolved devfile:\n',
        JSON.stringify(this.factoryResolver.converted.resolvedDevfile, undefined, 2),
      );
      console.debug(
        'Converted to:\n',
        JSON.stringify(this.factoryResolver.resolver.devfile, undefined, 2),
      );
      if (this.props.cheDevworkspaceEnabled) {
        resolvedDevfileMessage += ` Devfile version 1 found, converting it to devfile version ${
          (devfile as devfileApi.Devfile).schemaVersion
        }.`;
      } else {
        resolvedDevfileMessage += ' Devfile 2.x version found, converting it to devfile version 1.';
      }
    }

    this.setState({ resolvedDevfileMessage });
    return devfile;
  }

  private resolvePrivateDevfile(oauthUrl: string, location: string): void {
    try {
      // looking for a pre-created infrastructure namespace
      const namespaces = this.props.infrastructureNamespaces;
      if (namespaces.length === 0 || (namespaces.length === 1 && !namespaces[0].attributes.phase)) {
        this.showAlert(
          'Failed to accept the factory URL. The infrastructure namespace is required to be created. Please create a regular workspace to workaround the issue and open factory URL again.',
        );
        return;
      }

      const env = getEnvironment();
      // build redirect URL
      let redirectHost = window.location.protocol + '//' + window.location.host;
      if (isDevEnvironment(env)) {
        redirectHost = env.server;
      }
      const redirectUrl = new URL('/f', redirectHost);
      redirectUrl.searchParams.set('url', location);

      const oauthUrlTmp = new window.URL(oauthUrl);
      if (KeycloakAuthService.keycloak) {
        oauthUrlTmp.searchParams.set('token', KeycloakAuthService.keycloak.token as string);
      }
      const fullOauthUrl =
        oauthUrlTmp.toString() + '&redirect_after_login=' + redirectUrl.toString();

      if (isDevEnvironment(env)) {
        window.open(fullOauthUrl);
      } else {
        window.location.href = fullOauthUrl;
      }
    } catch (e) {
      this.showAlert('Failed to open authentication page.');
      throw e;
    }
  }

  private getWorkspaceV1StackName(factoryParams: string): string {
    const params = new window.URLSearchParams(factoryParams);
    const location = params.get('url');
    if (location) {
      const factoryUrl = new window.URL(location);

      params.forEach((val: string, key: string) => {
        if (key !== 'url') {
          factoryUrl.searchParams.append(key, val);
        }
      });
      return factoryUrl.toString();
    }
    return factoryParams;
  }

  private async resolveWorkspace(
    devfile: api.che.workspace.devfile.Devfile | devfileApi.Devfile,
    attrs: { [key: string]: string },
  ): Promise<Workspace | undefined> {
    let workspace: Workspace | undefined;
    const stackName = this.getWorkspaceV1StackName(attrs.factoryParams);
    if (this.state.createPolicy === 'peruser') {
      workspace = this.props.allWorkspaces.find(workspace => {
        if (isCheWorkspace(workspace.ref)) {
          return workspace.ref?.attributes?.stackName === stackName;
        } else {
          const annotations = workspace.ref.metadata.annotations;
          const source = annotations ? annotations[DEVWORKSPACE_DEVFILE_SOURCE] : undefined;
          if (source) {
            const sourceObj = safeLoad(source) as FactorySource;
            return sourceObj?.factory?.params === attrs.factoryParams;
          }
          // ignore createPolicy for dev workspaces
          return false;
        }
      });
    }
    if (!workspace) {
      // for backward compatibility with workspaces V1
      if (isCheDevfile(devfile)) {
        attrs.stackName = stackName;
        delete attrs.factoryParams;
        if (!devfile.metadata.name && devfile.metadata.generateName) {
          const name = devfile.metadata.generateName + getRandomString(4).toLowerCase();
          delete devfile.metadata.generateName;
          devfile.metadata.name = name;
        }
      }
      const namespace = this.props.defaultNamespace?.name;
      try {
        await this.props.createWorkspaceFromDevfile(
          devfile,
          undefined,
          namespace,
          attrs,
          this.factoryResolver.resolver?.optionalFilesContent || {},
        );
        this.props.setWorkspaceQualifiedName(namespace, devfile.metadata.name as string);
        workspace = this.props.activeWorkspace;
      } catch (e) {
        this.showAlert(`Failed to create a workspace. ${e}`);
        return;
      }
    }
    if (!workspace) {
      this.showAlert('Failed to create a workspace.');
      return;
    }
    // check if it ephemeral
    // not implemented for dev workspaces yet
    if (isCheWorkspace(workspace.ref) && workspace.storageType === 'ephemeral') {
      this.showAlert({
        title:
          "You're starting an ephemeral workspace. All changes to the source code will be lost " +
          'when the workspace is stopped unless they are pushed to a remote code repository.',
        alertVariant: AlertVariant.warning,
      });
    }

    return workspace;
  }

  private async createDevWorkspaceFromResources(
    devWorkspacePrebuiltResources: string,
    factoryParams: string,
    editorId?: string,
  ): Promise<Workspace | undefined> {
    let workspace: Workspace | undefined;

    // creation policy is `peruser`
    workspace = this.props.allWorkspaces.find(workspace => {
      if (isCheWorkspace(workspace.ref)) {
        return false;
      } else {
        const annotations = workspace.ref.metadata.annotations;
        const source = annotations ? annotations[DEVWORKSPACE_DEVFILE_SOURCE] : undefined;
        if (source) {
          const sourceObj = safeLoad(source) as FactorySource;
          return sourceObj?.factory?.params === factoryParams;
        }
        return false;
      }
    });

    if (!workspace) {
      try {
        let yamlContent: string;
        try {
          const response = await axios.get(devWorkspacePrebuiltResources);
          yamlContent = response.data;
        } catch (e) {
          const errorMessage = common.helpers.errors.getMessage(e);
          console.error(
            `Failed to fetch prebuilt resources from ${devWorkspacePrebuiltResources}. ${errorMessage}`,
          );
          this.showAlert(`Failed to fetch prebuilt resources. ${errorMessage}`);
          return;
        }

        const resources = safeLoadAll(yamlContent);
        const devworkspace = resources.find(
          resource => resource.kind === 'DevWorkspace',
        ) as devfileApi.DevWorkspace;
        const devworkspaceTemplate = resources.find(
          resource => resource.kind === 'DevWorkspaceTemplate',
        ) as devfileApi.DevWorkspaceTemplate;

        await this.props.createWorkspaceFromResources(devworkspace, devworkspaceTemplate, editorId);

        const namespace = this.props.defaultNamespace?.name;
        this.props.setWorkspaceQualifiedName(namespace, devworkspace.metadata.name as string);
        workspace = this.props.activeWorkspace;
      } catch (e) {
        this.showAlert(`Failed to create a workspace. ${e}`);
        return;
      }
    }
    if (!workspace) {
      this.showAlert('Failed to create a workspace.');
      return;
    }
    return workspace;
  }

  private tryAgainHandler(): void {
    const searchParams = new window.URLSearchParams(this.props.history.location.search);
    searchParams.delete('error_code');
    this.props.history.location.search = searchParams.toString();
    this.props.history.push(this.props.history.location);
  }

  private errorActionLinks(): React.ReactFragment {
    return (
      <React.Fragment>
        <AlertActionLink
          onClick={() => {
            this.tryAgainHandler();
          }}
        >
          Click to try again
        </AlertActionLink>
      </React.Fragment>
    );
  }

  private async startWorkspace(): Promise<void> {
    const workspace = this.props.workspace;
    if (!workspace) {
      return;
    }
    if (
      this.state.currentStep !== LoadFactorySteps.START_WORKSPACE &&
      this.state.currentStep !== LoadFactorySteps.OPEN_IDE
    ) {
      try {
        await this.props.requestWorkspace(workspace);
        if (workspace.isStopped) {
          await this.props.startWorkspace(workspace);
          this.setState({ currentStep: LoadFactorySteps.START_WORKSPACE });
        } else if (workspace.isRunning || workspace.isStarting) {
          this.setState({ currentStep: LoadFactorySteps.START_WORKSPACE });
        }
      } catch (e) {
        this.showAlert(`Getting workspace detail data failed. ${e}`);
      }
    }
  }

  private async createWorkspaceFromFactory(): Promise<void> {
    this.clearOldData();

    const search = this.getSearchParam();

    if (!search) {
      return;
    }

    const errorCode = this.getErrorCode(search);
    if (errorCode === ErrorCodes.INVALID_REQUEST) {
      this.showAlert({
        alertActionLinks: this.errorActionLinks(),
        title:
          'Could not resolve devfile from private repository because authentication request is missing' +
          ' a parameter, contains an invalid parameter, includes a parameter more than once, or is otherwise invalid.',
        alertVariant: AlertVariant.danger,
      });
      return;
    }
    if (errorCode === ErrorCodes.ACCESS_DENIED) {
      if (!this.state.hasError) {
        this.showAlert({
          alertActionLinks: this.errorActionLinks(),
          title:
            'Could not resolve devfile from private repository because the user or authorization server denied the authentication request.',
          alertVariant: AlertVariant.danger,
        });
      }
      return;
    }

    this.setState({ search, currentStep: LoadFactorySteps.CREATE_WORKSPACE });

    const location = this.getLocation(search);

    if (!location) {
      return;
    }

    const attrs = this.getAttributes(location, search);
    const createPolicy = this.getCreatePolicy(attrs);

    if (!createPolicy) {
      return;
    }
    this.setState({ location, createPolicy, currentStep: LoadFactorySteps.LOOKING_FOR_DEVFILE });

    await delay();

    let workspace: Workspace | undefined;
    if (this.props.cheDevworkspaceEnabled && attrs.devWorkspace) {
      // create workspace using prebuilt resources
      workspace = await this.createDevWorkspaceFromResources(
        attrs.devWorkspace,
        attrs.factoryParams,
        attrs['che-editor'],
      );
    } else {
      // create workspace using a devfile
      this.setState({
        createFromDevfile: true,
      });

      let devfile = await this.resolveDevfile(location);

      if (!devfile) {
        return;
      }

      devfile = updateDevfileMetadata(devfile, attrs.factoryParams, createPolicy);
      this.setState({ currentStep: LoadFactorySteps.APPLYING_DEVFILE });

      await delay();

      workspace = await this.resolveWorkspace(devfile, attrs);
    }

    if (!workspace) {
      return;
    }

    this.props.setWorkspaceId(workspace.id);

    await this.startWorkspace();

    await this.openIde();
  }

  render() {
    const { workspace } = this.props;
    const {
      currentStep,
      resolvedDevfileMessage,
      hasError,
      cheDevworkspaceEnabled,
      createFromDevfile,
    } = this.state;
    const workspaceName = workspace ? workspace.name : '';
    const workspaceId = workspace ? workspace.id : '';

    return (
      <FactoryLoader
        currentStep={currentStep}
        hasError={hasError}
        resolvedDevfileMessage={resolvedDevfileMessage}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        createFromDevfile={createFromDevfile}
        isDevWorkspace={cheDevworkspaceEnabled}
        callbacks={this.factoryLoaderCallbacks}
      />
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  factoryResolver: state.factoryResolver,
  workspace: selectWorkspaceById(state),
  allWorkspaces: selectAllWorkspaces(state),
  infrastructureNamespaces: selectInfrastructureNamespaces(state),
  preferredStorageType: selectPreferredStorageType(state),
  activeWorkspace: selectWorkspaceByQualifiedName(state),
  defaultNamespace: selectDefaultNamespace(state),
  workspacesSettings: selectWorkspacesSettings(state),
  cheDevworkspaceEnabled: selectDevworkspacesEnabled(state),
});

const connector = connect(mapStateToProps, {
  ...FactoryResolverStore.actionCreators,
  ...WorkspacesStore.actionCreators,
  createWorkspaceFromResources: DevWorkspacesStore.actionCreators.createWorkspaceFromResources,
});

type MappedProps = ConnectedProps<typeof connector>;
export default connector(FactoryLoaderContainer);
