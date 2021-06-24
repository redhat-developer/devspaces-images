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

import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { injectable } from 'inversify';
import { KeycloakSetupService } from '../keycloak/setup';
import { KeycloakAuthService } from '../keycloak/auth';
import { default as WorkspaceClientLib } from '@eclipse-che/workspace-client';

const VALIDITY_TIME = 5;
export type WebSocketsFailedCallback = () => void;

/**
 * This class manages the common functions between the che workspace client and the devworkspace client
 */
@injectable()
export abstract class WorkspaceClient {
  protected readonly axios: AxiosInstance;

  constructor(private keycloakSetupService: KeycloakSetupService) {
    // todo change this temporary solution after adding the proper method to workspace-client https://github.com/eclipse/che/issues/18311
    this.axios = (WorkspaceClientLib as any).createAxiosInstance({ loggingEnabled: false });

    this.keycloakSetupService.ready.then(() => {
      if (!KeycloakAuthService.sso) {
        return;
      }

      this.axios.interceptors.request.use(async config => {
        await this.handleRefreshToken(VALIDITY_TIME, config);
        return config;
      });

      window.addEventListener('message', (event: MessageEvent) => {
        if (typeof event.data === 'string' && event.data.startsWith('update-token:')) {
          const receivedValue = parseInt(event.data.split(':')[1], 10);
          const validityTime = Number.isNaN(receivedValue) ? VALIDITY_TIME : Math.ceil(receivedValue / 1000);
          this.handleRefreshToken(validityTime);
        }
      }, false);
    });
  }

  private async handleRefreshToken(minValidity: number, config?: AxiosRequestConfig): Promise<void> {
    try {
      await this.refreshToken(minValidity, config);
    } catch (e) {
      console.error('Failed to refresh token.', e);
      this.redirectedToKeycloakLogin();
    }
  }

  private redirectedToKeycloakLogin(): void {
    const { sessionStorage, location: { href } } = window;
    const { keycloak } = KeycloakAuthService;

    sessionStorage.setItem('oidcDashboardRedirectUrl', href);
    if (keycloak && keycloak.login) {
      keycloak.login();
    }
  }

  protected get token(): string | undefined {
    const { keycloak } = KeycloakAuthService;
    return keycloak ? keycloak.token : undefined;
  }

  protected refreshToken(minValidity: number, config?: AxiosRequestConfig): Promise<string | Error> {
    const { keycloak } = KeycloakAuthService;
    if (keycloak) {
      return new Promise((resolve, reject) => {
        keycloak.updateToken(minValidity).success((refreshed: boolean) => {
          const header = 'Authorization';
          if (refreshed || (config && !config.headers.common[header])) {
            if (config) {
              config.headers.common[header] = `Bearer ${keycloak.token}`;
            }
          }
          resolve(keycloak.token as string);
        }).error((error: any) => {
          reject(new Error(error));
        });
      });
    }
    if (!this.token) {
      return Promise.reject(new Error('Unable to resolve token'));
    }
    return Promise.resolve(this.token);
  }
}
