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

import { inject, injectable } from 'inversify';
import {
  default as WorkspaceClientLib,
  IWorkspaceMasterApi,
  IRemoteAPI,
} from '@eclipse-che/workspace-client';
import { EventEmitter } from 'events';
import { WorkspaceClient } from '../index';
import { KeycloakSetupService } from '../../keycloak/setup';
import { KeycloakAuthService } from '../../keycloak/auth';

export type WebSocketsFailedCallback = () => void;

const VALIDITY_TIME = 5;

/**
 * This class manages the api connection.
 */
@injectable()
export class CheWorkspaceClient extends WorkspaceClient {
  private originLocation: string;
  private baseUrl: string;
  private _restApiClient: IRemoteAPI;
  private _jsonRpcMasterApi: IWorkspaceMasterApi;
  private _failingWebSockets: string[];
  private webSocketEventEmitter: EventEmitter;
  private webSocketEventName = 'websocketChanged';
  private defaultNamespace: string;

  /**
   * Default constructor that is using resource.
   */
  constructor(@inject(KeycloakSetupService) keycloakSetupService: KeycloakSetupService) {
    super(keycloakSetupService);
    this.baseUrl = '/api';
    this._failingWebSockets = [];
    this.webSocketEventEmitter = new EventEmitter();

    this.originLocation = new URL(window.location.href).origin;
  }

  get restApiClient(): IRemoteAPI {
    // Lazy initialization of restApiClient
    if (!this._restApiClient) {
      this.updateRestApiClient();
    }
    return this._restApiClient;
  }

  get jsonRpcMasterApi(): IWorkspaceMasterApi {
    return this._jsonRpcMasterApi;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  updateRestApiClient(): void {
    const baseUrl = this.baseUrl;
    this._restApiClient = WorkspaceClientLib.getRestApi({ baseUrl });
  }

  async updateJsonRpcMasterApi(): Promise<void> {
    const jsonRpcApiLocation = this.originLocation.replace('http', 'ws');
    const tokenRefresher = () => {
      if (!KeycloakAuthService.sso) {
        return Promise.resolve('');
      }
      return this.refreshToken(VALIDITY_TIME);
    };
    this._jsonRpcMasterApi = WorkspaceClientLib.getJsonRpcApi(jsonRpcApiLocation, tokenRefresher);
    this._jsonRpcMasterApi.onDidWebSocketStatusChange((websockets: string[]) => {
      this._failingWebSockets = [];
      for (const websocket of websockets) {
        const trimmedWebSocketId = websocket.substring(0, websocket.indexOf('?'));
        this._failingWebSockets.push(trimmedWebSocketId);
      }
      this.webSocketEventEmitter.emit(this.webSocketEventName);
    });
    await this._jsonRpcMasterApi.connect();
  }

  onWebSocketFailed(callback: WebSocketsFailedCallback) {
    this.webSocketEventEmitter.on(this.webSocketEventName, callback);
  }

  removeWebSocketFailedListener() {
    this.webSocketEventEmitter.removeAllListeners(this.webSocketEventName);
  }

  get failingWebSockets(): string[] {
    return Array.from(this._failingWebSockets);
  }

  async getDefaultNamespace(): Promise<string> {
    if (this.defaultNamespace) {
      return this.defaultNamespace;
    }
    const namespaces = await this.restApiClient.getKubernetesNamespace();
    if (namespaces.length === 1) {
      return namespaces[0].name;
    }
    const defaultNamespace = namespaces.filter(
      kubernetesNamespace => kubernetesNamespace.attributes.default === 'true',
    );
    if (defaultNamespace.length === 0) {
      throw new Error('Default namespace is not found');
    }
    this.defaultNamespace = defaultNamespace[0].name;
    return this.defaultNamespace;
  }
}
