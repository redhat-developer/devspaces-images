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

import { AxiosInstance } from 'axios';
import { inject, injectable } from 'inversify';
import { KeycloakSetupService } from '../keycloak/setup';
import { KeycloakAuthService } from '../keycloak/auth';
import { default as WorkspaceClientLib } from '@eclipse-che/workspace-client';
import { helpers } from '@eclipse-che/common';

const VALIDITY_TIME = 5;
export type WebSocketsFailedCallback = () => void;

/**
 * This class manages the common functions between the che workspace client and the devworkspace client
 */
@injectable()
export abstract class WorkspaceClient {
  protected readonly axios: AxiosInstance;

  @inject(KeycloakAuthService)
  private readonly keycloakAuthService: KeycloakAuthService;

  constructor(private keycloakSetupService: KeycloakSetupService) {
    // change this temporary solution after adding the proper method to workspace-client https://github.com/eclipse/che/issues/18311
    this.axios = (WorkspaceClientLib as any).createAxiosInstance({ loggingEnabled: false });

    this.keycloakSetupService.ready.then(() => {
      if (!KeycloakAuthService.sso) {
        return;
      }

      this.axios.interceptors.request.use(async config => {
        await this.keycloakAuthService.updateToken(VALIDITY_TIME, config);
        return config;
      });

      window.addEventListener(
        'message',
        (event: MessageEvent) => {
          if (typeof event.data === 'string' && event.data.startsWith('update-token:')) {
            const receivedValue = parseInt(event.data.split(':')[1], 10);
            const validityTime = Number.isNaN(receivedValue)
              ? VALIDITY_TIME
              : Math.ceil(receivedValue / 1000);
            this.keycloakAuthService.updateToken(validityTime);
          }
        },
        false,
      );
    });
  }

  async refreshToken(validityTime: number): Promise<string | Error> {
    try {
      const token = await this.keycloakAuthService.updateToken(validityTime);
      return token || '';
    } catch (e) {
      return new Error(helpers.errors.getMessage(e));
    }
  }

  protected get token(): string | undefined {
    const { keycloak } = KeycloakAuthService;
    return keycloak ? keycloak.token : undefined;
  }
}
