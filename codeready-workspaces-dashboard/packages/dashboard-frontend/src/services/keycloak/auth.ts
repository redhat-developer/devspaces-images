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

import { injectable } from 'inversify';
import { KeycloakInstance } from 'keycloak-js';
import { getDefer, IDeferred } from '../helpers/deferred';
import { AxiosRequestConfig } from 'axios';

export type IKeycloakUserInfo = {
  email: string;
  family_name: string;
  given_name: string;
  preferred_username: string;
  sub: string;
};

/**
 * This class is handling interactions with Keycloak
 */
@injectable()
export class KeycloakAuthService {

  /* indicates that SSO enabled */
  static sso = false;
  /* keycloak instance */
  static keycloak: KeycloakInstance | undefined;

  fetchUserInfo(): Promise<IKeycloakUserInfo> {
    const defer: IDeferred<IKeycloakUserInfo> = getDefer();

    if (!KeycloakAuthService.keycloak) {
      defer.reject('Keycloak is not found on the page.');
      return defer.promise;
    }

    KeycloakAuthService.keycloak.loadUserInfo().success(userInfo => {
      defer.resolve(userInfo as any);
    }).error((error: any) => {
      defer.reject(`User info fetching failed, error: ${error}`);
    });

    return defer.promise;
  }

  async forceUpdateToken(): Promise<void> {
    await this.updateToken(3600);
  }

  async updateToken(minValidity: number, config?: AxiosRequestConfig): Promise<string | undefined> {
    const { keycloak } = KeycloakAuthService;
    if (!keycloak || !keycloak.updateToken) {
      return;
    }
    try {
      return new Promise((resolve, reject) => {
        keycloak.updateToken(minValidity).success((refreshed: boolean) => {
          const header = 'Authorization';
          if (refreshed || (config && !config.headers.common[header])) {
            if (config) {
              config.headers.common[header] = `Bearer ${keycloak.token}`;
            }
          }
          resolve(keycloak.token);
        }).error((error: any) => {
          reject(new Error(error));
        });
      });
    } catch (e) {
      window.sessionStorage.setItem('oidcDashboardRedirectUrl', window.location.href);
      if (keycloak && keycloak.login) {
        keycloak.login();
      }
      throw new Error('Failed to update token. \n' + e);
    }
  }

  isPresent(): boolean {
    return KeycloakAuthService.sso;
  }

  getProfileUrl(): string {
    const { keycloak } = KeycloakAuthService;
    return keycloak && keycloak.createAccountUrl ? keycloak.createAccountUrl() : '';
  }

  logout(): void {
    window.sessionStorage.removeItem('githubToken');
    window.sessionStorage.setItem('oidcDashboardRedirectUrl', window.location.href);
    const { keycloak } = KeycloakAuthService;
    if (keycloak && keycloak.logout) {
      keycloak.logout({});
    }
  }

}
