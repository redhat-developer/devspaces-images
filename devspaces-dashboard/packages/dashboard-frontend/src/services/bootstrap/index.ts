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

import common, { api } from '@eclipse-che/common';
import { Store } from 'redux';

import { lazyInject } from '@/inversify.config';
import { WebsocketClient } from '@/services/backend-client/websocketClient';
import { ChannelListener } from '@/services/backend-client/websocketClient/messageHandler';
import {
  IssuesReporterService,
  IssueType,
  WorkspaceData,
} from '@/services/bootstrap/issuesReporter';
import { checkNamespaceProvisionWarnings } from '@/services/bootstrap/namespaceProvisionWarnings';
import {
  WorkspaceRunningError,
  WorkspaceStoppedDetector,
} from '@/services/bootstrap/workspaceStoppedDetector';
import { isAvailableEndpoint } from '@/services/helpers/api-ping';
import { buildDetailsLocation, buildIdeLoaderLocation } from '@/services/helpers/location';
import { ResourceFetcherService } from '@/services/resource-fetcher';
import { Workspace } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import * as BannerAlertStore from '@/store/BannerAlert';
import * as BrandingStore from '@/store/Branding';
import * as ClusterConfigStore from '@/store/ClusterConfig';
import { selectDashboardFavicon } from '@/store/ClusterConfig/selectors';
import * as ClusterInfoStore from '@/store/ClusterInfo';
import * as DevfileRegistriesStore from '@/store/DevfileRegistries';
import { DEFAULT_REGISTRY } from '@/store/DevfileRegistries';
import { selectEmptyWorkspaceUrl } from '@/store/DevfileRegistries/selectors';
import * as EventsStore from '@/store/Events';
import { selectEventsResourceVersion } from '@/store/Events/selectors';
import * as InfrastructureNamespacesStore from '@/store/InfrastructureNamespaces';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import * as PluginsStore from '@/store/Plugins/chePlugins';
import * as DwPluginsStore from '@/store/Plugins/devWorkspacePlugins';
import * as PodsStore from '@/store/Pods';
import { selectPodsResourceVersion } from '@/store/Pods/selectors';
import * as SanityCheckStore from '@/store/SanityCheck';
import * as ServerConfigStore from '@/store/ServerConfig';
import * as SshKeysStore from '@/store/SshKeys';
import * as UserProfileStore from '@/store/User/Profile';
import * as WorkspacesStore from '@/store/Workspaces';
import * as DevWorkspacesStore from '@/store/Workspaces/devWorkspaces';
import { selectDevWorkspacesResourceVersion } from '@/store/Workspaces/devWorkspaces/selectors';
import { workspacePreferencesActionCreators } from '@/store/Workspaces/Preferences';

/**
 * This class executes initial instructions
 * @author Oleksii Orel
 */
export default class Bootstrap {
  @lazyInject(IssuesReporterService)
  private readonly issuesReporterService: IssuesReporterService;

  @lazyInject(WebsocketClient)
  private readonly websocketClient: WebsocketClient;

  @lazyInject(WorkspaceStoppedDetector)
  private readonly workspaceStoppedDetector: WorkspaceStoppedDetector;

  private store: Store<AppState>;

  private resourceFetcher: ResourceFetcherService;

  constructor(store: Store<AppState>) {
    this.store = store;
    this.resourceFetcher = new ResourceFetcherService();
  }

  async init(): Promise<void> {
    await this.fetchServerConfig().then(() => this.doBackendsSanityCheck());
    this.prefetchResources();

    await Promise.all([
      this.fetchBranding(),
      this.fetchInfrastructureNamespaces(),
      this.fetchClusterInfo(),
    ]);

    const results = await Promise.allSettled([
      this.fetchUserProfile(),
      this.fetchPlugins().then(() => this.fetchDwPlugins()),
      this.fetchDefaultDwPlugins(),
      this.fetchRegistriesMetadata().then(() => this.fetchEmptyWorkspace()),
      this.fetchWorkspaces().then(() => {
        this.checkWorkspaceStopped();
        return this.watchWebSocketDevWorkspaces();
      }),
      this.fetchEvents().then(() => {
        this.watchWebSocketEvents();
      }),
      this.fetchPods().then(() => {
        this.watchWebSocketPods();
      }),
      this.fetchClusterConfig().then(() => this.updateFavicon()),
      this.fetchSshKeys(),
      this.fetchWorkspacePreferences(),
    ]);

    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason.toString());
    if (errors.length > 0) {
      throw errors;
    }
  }

  private prefetchResources(): void {
    const state = this.store.getState();
    this.resourceFetcher.prefetchResources(state).catch(e => {
      console.warn('Unable to fetch prefetch resources.', e);
    });
  }

  private async doBackendsSanityCheck(): Promise<void> {
    const { testBackends } = SanityCheckStore.actionCreators;
    try {
      await testBackends()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      checkNamespaceProvisionWarnings(this.store.getState);
      const errorMessage = common.helpers.errors.getMessage(e);
      this.issuesReporterService.registerIssue(
        'namespaceProvisioningError',
        new Error(errorMessage),
      );
      throw e;
    }
  }

  private async fetchClusterConfig(): Promise<void> {
    const { requestClusterConfig } = ClusterConfigStore.actionCreators;
    try {
      await requestClusterConfig()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      console.warn(
        'Unable to fetch cluster configuration. This is expected behavior unless backend is configured to provide this information.',
      );
    }
  }

  private async fetchClusterInfo(): Promise<void> {
    const { requestClusterInfo } = ClusterInfoStore.actionCreators;
    try {
      await requestClusterInfo()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      console.warn(
        'Unable to fetch cluster info. This is expected behavior unless backend is configured to provide this information.',
      );
    }
  }

  private async fetchBranding(): Promise<void> {
    const { requestBranding } = BrandingStore.actionCreators;
    try {
      await requestBranding()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      const errorMessage = common.helpers.errors.getMessage(e);
      this.issuesReporterService.registerIssue('unknown', new Error(errorMessage));
    }
  }

  private async watchWebSocketDevWorkspaces(): Promise<void> {
    const defaultKubernetesNamespace = selectDefaultNamespace(this.store.getState());
    const namespace = defaultKubernetesNamespace.name;
    const { handleWebSocketMessage } = DevWorkspacesStore.actionCreators;
    const dispatch = this.store.dispatch;
    const getState = this.store.getState;

    await this.websocketClient.connect();

    /* add listener and subscribe to devWorkspaces channel */

    const listener: ChannelListener = message => {
      handleWebSocketMessage(message)(dispatch, getState, undefined);
    };
    this.websocketClient.addChannelMessageListener(api.webSocket.Channel.DEV_WORKSPACE, listener);

    // in case of reconnect we need to get the latest resource version
    const getResourceVersion = () => {
      const state = getState();
      return selectDevWorkspacesResourceVersion(state);
    };

    this.websocketClient.subscribeToChannel(api.webSocket.Channel.DEV_WORKSPACE, namespace, {
      getResourceVersion,
    });
  }

  private async watchWebSocketEvents(): Promise<void> {
    const defaultKubernetesNamespace = selectDefaultNamespace(this.store.getState());
    const namespace = defaultKubernetesNamespace.name;
    const { handleWebSocketMessage } = EventsStore.actionCreators;
    const dispatch = this.store.dispatch;
    const getState = this.store.getState;

    await this.websocketClient.connect();

    /* add listener and subscribe to events channel */

    const listener: ChannelListener = message => {
      handleWebSocketMessage(message)(dispatch, getState, undefined);
    };
    this.websocketClient.addChannelMessageListener(api.webSocket.Channel.EVENT, listener);

    // in case of reconnect we need to get the latest resource version
    const getResourceVersion = () => {
      const state = getState();
      return selectEventsResourceVersion(state);
    };

    this.websocketClient.subscribeToChannel(api.webSocket.Channel.EVENT, namespace, {
      getResourceVersion,
    });
  }

  private async watchWebSocketPods(): Promise<void> {
    const defaultKubernetesNamespace = selectDefaultNamespace(this.store.getState());
    const namespace = defaultKubernetesNamespace.name;
    const { handleWebSocketMessage } = PodsStore.actionCreators;
    const dispatch = this.store.dispatch;
    const getState = this.store.getState;

    await this.websocketClient.connect();

    /* add listener and subscribe to pods channel */

    const listener: ChannelListener = message => {
      handleWebSocketMessage(message)(dispatch, getState, undefined);
    };
    this.websocketClient.addChannelMessageListener(api.webSocket.Channel.POD, listener);

    // in case of reconnect we need to get the latest resource version
    const getResourceVersion = () => {
      const state = getState();
      return selectPodsResourceVersion(state);
    };

    this.websocketClient.subscribeToChannel(api.webSocket.Channel.POD, namespace, {
      getResourceVersion,
    });
  }

  private async fetchWorkspaces(): Promise<void> {
    const { requestWorkspaces } = WorkspacesStore.actionCreators;
    await requestWorkspaces()(this.store.dispatch, this.store.getState, undefined);
  }

  private async fetchEvents(): Promise<void> {
    const { requestEvents } = EventsStore.actionCreators;
    await requestEvents()(this.store.dispatch, this.store.getState, undefined);
  }

  private async fetchPods(): Promise<void> {
    const { requestPods } = PodsStore.actionCreators;
    await requestPods()(this.store.dispatch, this.store.getState, undefined);
  }

  private async fetchPlugins(): Promise<void> {
    const { requestPlugins } = PluginsStore.actionCreators;
    await requestPlugins()(this.store.dispatch, this.store.getState, undefined);
  }

  private async fetchDwPlugins(): Promise<void> {
    const { requestDwDefaultEditor } = DwPluginsStore.actionCreators;
    try {
      await requestDwDefaultEditor()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      const message = `Required sources failed when trying to create the workspace: ${e}`;
      const { addBanner } = BannerAlertStore.actionCreators;
      addBanner(message)(this.store.dispatch, this.store.getState, undefined);

      throw e;
    }
  }

  private async fetchDefaultDwPlugins(): Promise<void> {
    const { requestDwDefaultPlugins } = DwPluginsStore.actionCreators;
    try {
      await requestDwDefaultPlugins()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      console.error('Failed to retrieve default plug-ins.', e);
    }
  }

  private async fetchInfrastructureNamespaces(): Promise<void> {
    const { requestNamespaces } = InfrastructureNamespacesStore.actionCreators;
    try {
      await requestNamespaces()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      console.error(e);
    }
  }

  private async fetchServerConfig(): Promise<void> {
    const { requestServerConfig } = ServerConfigStore.actionCreators;
    try {
      await requestServerConfig()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      console.error(e);
    }
  }

  private async fetchRegistriesMetadata(): Promise<void> {
    const { requestRegistriesMetadata } = DevfileRegistriesStore.actionCreators;
    const defaultRegistry = DEFAULT_REGISTRY.startsWith('http')
      ? DEFAULT_REGISTRY
      : new URL(DEFAULT_REGISTRY, window.location.origin).href;
    await requestRegistriesMetadata(defaultRegistry, false)(
      this.store.dispatch,
      this.store.getState,
      undefined,
    );

    const gettingStartedSampleURL = new URL(
      '/dashboard/api/getting-started-sample',
      window.location.origin,
    ).href;
    await requestRegistriesMetadata(gettingStartedSampleURL, false)(
      this.store.dispatch,
      this.store.getState,
      undefined,
    );

    const serverConfig = this.store.getState().dwServerConfig.config;
    const devfileRegistry = serverConfig.devfileRegistry;
    if (
      devfileRegistry?.disableInternalRegistry !== undefined &&
      devfileRegistry?.disableInternalRegistry !== true
    ) {
      const airGapedSampleURL = new URL('/dashboard/api/airgap-sample', window.location.origin)
        .href;
      await requestRegistriesMetadata(airGapedSampleURL, false)(
        this.store.dispatch,
        this.store.getState,
        undefined,
      );
    }

    const externalRegistries = devfileRegistry.externalDevfileRegistries.map(
      registry => registry?.url,
    );
    if (externalRegistries.length > 0) {
      await requestRegistriesMetadata(externalRegistries.join(' '), true)(
        this.store.dispatch,
        this.store.getState,
        undefined,
      );
    }
  }

  private async fetchEmptyWorkspace(): Promise<void> {
    const { requestDevfile } = DevfileRegistriesStore.actionCreators;
    const state = this.store.getState();
    const emptyWorkspaceUrl = selectEmptyWorkspaceUrl(state);
    if (emptyWorkspaceUrl) {
      await requestDevfile(emptyWorkspaceUrl)(this.store.dispatch, this.store.getState, undefined);
    }
  }

  private async fetchUserProfile(): Promise<void> {
    const defaultKubernetesNamespace = selectDefaultNamespace(this.store.getState());
    const defaultNamespace = defaultKubernetesNamespace.name;

    const { requestUserProfile } = UserProfileStore.actionCreators;
    return requestUserProfile(defaultNamespace)(
      this.store.dispatch,
      this.store.getState,
      undefined,
    );
  }

  private checkWorkspaceStopped(): void {
    let stoppedWorkspace: Workspace | undefined;

    try {
      stoppedWorkspace = this.workspaceStoppedDetector.checkWorkspaceStopped(this.store.getState());
      if (!stoppedWorkspace) {
        return;
      }

      const type: IssueType =
        this.workspaceStoppedDetector.getWorkspaceStoppedIssueType(stoppedWorkspace);
      const workspaceData: WorkspaceData = {
        ideLoaderPath: buildIdeLoaderLocation(stoppedWorkspace).pathname,
        workspaceDetailsPath: buildDetailsLocation(stoppedWorkspace).pathname,
      };
      if (type === 'workspaceInactive' || type === 'workspaceRunTimeout') {
        workspaceData.timeout = this.getWorkspaceTimeout(type);
      }

      const error = this.workspaceStoppedDetector.getWorkspaceStoppedError(stoppedWorkspace, type);
      this.issuesReporterService.registerIssue(type, error, workspaceData);
    } catch (e) {
      if (e instanceof WorkspaceRunningError) {
        if (e.workspace.ideUrl) {
          const ideUrl = e.workspace.ideUrl;
          isAvailableEndpoint(ideUrl).then(isAvailable => {
            if (isAvailable) {
              window.location.replace(ideUrl);
            }
          });
        }
      } else {
        console.warn('Unable to check for stopped workspace.', e);
      }
    }
  }

  private getWorkspaceTimeout(issueType: IssueType): number {
    if (issueType === 'workspaceInactive') {
      return this.store.getState().dwServerConfig.config.timeouts.inactivityTimeout;
    }

    if (issueType === 'workspaceRunTimeout') {
      return this.store.getState().dwServerConfig.config.timeouts.runTimeout;
    }
    return -1;
  }

  private updateFavicon() {
    const dashboardFavicon = selectDashboardFavicon(this.store.getState());
    if (dashboardFavicon?.base64data && dashboardFavicon?.mediatype) {
      const hrefAttribute = `data:${dashboardFavicon?.mediatype};base64,${dashboardFavicon?.base64data}`;
      if (window.document) {
        const faviconHTML = window.document.getElementById('dashboardFavicon');
        if (faviconHTML) {
          faviconHTML.setAttribute('href', hrefAttribute);
        }
      }
    }
  }

  private async fetchSshKeys(): Promise<void> {
    const { requestSshKeys } = SshKeysStore.actionCreators;
    await requestSshKeys()(this.store.dispatch, this.store.getState, undefined);
  }

  private async fetchWorkspacePreferences(): Promise<void> {
    await workspacePreferencesActionCreators.requestPreferences()(
      this.store.dispatch,
      this.store.getState,
      undefined,
    );
  }
}
