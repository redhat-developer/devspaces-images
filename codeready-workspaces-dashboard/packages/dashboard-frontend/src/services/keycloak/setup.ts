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

import 'reflect-metadata';
import 'keycloak-js';
import axios from 'axios';
import { inject, injectable } from 'inversify';
import { KeycloakInstance } from 'keycloak-js';
import common from '@eclipse-che/common';
import { IssuesReporterService } from '../bootstrap/issuesReporter';
import { KeycloakAuthService } from './auth';
import isDocumentReady from '../helpers/document';

const keycloakSettingsFields = [
  'che.keycloak.oidc_provider',
  'che.keycloak.auth_server_url',
  'che.keycloak.client_id',
  'che.keycloak.js_adapter_url',
  'che.keycloak.jwks.endpoint',
  'che.keycloak.logout.endpoint',
  'che.keycloak.password.endpoint',
  'che.keycloak.profile.endpoint',
  'che.keycloak.realm',
  'che.keycloak.token.endpoint',
  'che.keycloak.use_nonce',
  'che.keycloak.userinfo.endpoint',
  'che.keycloak.username_claim',
  'che.keycloak.redirect_url.dashboard',
] as const;
type KeycloakSettingsField = typeof keycloakSettingsFields[number];

function isOfTypeKeycloakSettingsField(
  settingField: string,
): settingField is KeycloakSettingsField {
  return (keycloakSettingsFields as readonly string[]).indexOf(settingField) >= 0;
}

type KeycloakSettingsMap = Map<KeycloakSettingsField, string>;

type KeycloakConfig =
  | Keycloak.KeycloakConfig
  | {
      oidcProvider: string;
      clientId: string;
    };

/**
 * This class is handling the keycloak settings data.
 * @author Oleksii Orel
 */

@injectable()
export class KeycloakSetupService {
  @inject(IssuesReporterService)
  private readonly issuesReporterService: IssuesReporterService;

  @inject(KeycloakAuthService)
  private readonly keycloakAuthService: KeycloakAuthService;

  private user: che.User | undefined;
  private _ready: Promise<void>;
  private resolveReadyPromise: (value: void | PromiseLike<void>) => void;

  constructor() {
    this._ready = new Promise<void>(resolve => (this.resolveReadyPromise = resolve));
  }

  async start(): Promise<void> {
    await this.doInitialization();
    const { keycloak } = KeycloakAuthService;
    if (keycloak) {
      await this.setAuthorizationHeader();
    }
    this.resolveReadyPromise();

    /* test API */
    try {
      const endpoint = '/api/user';
      const result = await this.testApiAttainability<che.User>(endpoint);
      this.user = result;
    } catch (e) {
      throw new Error('Failed to get response to API endpoint: \n' + e);
    }
  }

  public get ready(): Promise<void> {
    return this._ready;
  }

  private async doInitialization(): Promise<void> {
    if (KeycloakAuthService.sso) {
      return;
    }

    try {
      /* load Keycloak adapter settings */
      const settings = await this.fetchSettings();
      if (!settings) {
        console.warn('Keycloak is not configured. Running in Single User mode.');
        return;
      }

      /* check for Keycloak adapter URL */
      const src = settings.get('che.keycloak.js_adapter_url');
      if (!src) {
        console.warn('Keycloak adapter URL is not found. Skip initializing Keycloak.');
        return;
      }
      KeycloakAuthService.sso = true;

      const config = this.buildKeycloakConfig(settings);

      /* load Keycloak adapter */
      await this.loadAdapterScript(src);

      /* initialize Keycloak adapter */
      const keycloak = await this.initKeycloak(config, settings);

      KeycloakAuthService.keycloak = keycloak;
    } catch (e) {
      console.warn('Keycloak initialization failed.', e);
    }
  }

  private async fetchSettings(): Promise<KeycloakSettingsMap | undefined> {
    try {
      const response = await axios.get('/api/keycloak/settings');

      const settings: KeycloakSettingsMap = new Map();
      for (const key of Object.keys(response.data)) {
        if (isOfTypeKeycloakSettingsField(key)) {
          settings.set(key, response.data[key]);
        } else {
          console.warn('Skip keycloak settings field: ', key);
        }
      }

      return settings;
    } catch (e) {
      if (common.helpers.errors.isAxiosError(e) && e.response?.status === 404) {
        // not found, which mean Che Server is configured to be run without keycloak.
        return;
      }

      let errorMessage = 'Cannot get Keycloak settings';
      if (common.helpers.errors.isAxiosError(e)) {
        errorMessage += ': ' + common.helpers.errors.getMessage(e);
      } else {
        errorMessage +=
          '. Response is not available, please check the Network tab of Developer tools.';
      }
      throw new Error(errorMessage);
    }
  }

  private async loadAdapterScript(src: string): Promise<void> {
    await isDocumentReady();

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = src;
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', () => {
        const error = new Error(`Keycloak adapter script loading failed from "${src}".`);
        this.issuesReporterService.registerIssue('cert', error);
        reject(error);
      });
      script.addEventListener('abort', () => {
        reject(new Error('Keycloak adapter script loading aborted.'));
      });
      document.head.appendChild(script);
    });
  }

  private buildKeycloakConfig(settings: KeycloakSettingsMap): KeycloakConfig {
    const theOidcProvider = settings.get('che.keycloak.oidc_provider');
    if (!theOidcProvider) {
      return {
        url: settings.get('che.keycloak.auth_server_url'),
        realm: settings.get('che.keycloak.realm') || '',
        clientId: settings.get('che.keycloak.client_id') || '',
      };
    } else {
      return {
        oidcProvider: theOidcProvider,
        clientId: settings.get('che.keycloak.client_id') || '',
      };
    }
  }

  private async initKeycloak(
    config: KeycloakConfig,
    settings: KeycloakSettingsMap,
  ): Promise<KeycloakInstance> {
    let useNonce = false;
    const nonce = settings.get('che.keycloak.use_nonce');
    if (nonce) {
      useNonce = nonce.toLowerCase() === 'true';
    }
    const initOptions = {
      useNonce,
    };

    const Keycloak = window['Keycloak'];
    if (!Keycloak) {
      throw new Error('Keycloak Adapter not found.');
    }

    const keycloak = Keycloak(config as Keycloak.KeycloakConfig);
    window.sessionStorage.setItem('oidcDashboardRedirectUrl', location.href);

    return new Promise((resolve, reject) => {
      keycloak
        .init({
          onLoad: 'login-required',
          checkLoginIframe: false,
          useNonce: initOptions['useNonce'],
        })
        .success(() => {
          resolve(keycloak);
        })
        .error((keycloakError: Keycloak.KeycloakError) => {
          const errorDescr = keycloakError
            ? `${keycloakError.error}: ${keycloakError.error_description}`
            : '';
          const errorMessage =
            'Keycloak initialization failed' + (errorDescr ? ': ' : '') + errorDescr;

          this.issuesReporterService.registerIssue('sso', new Error(errorMessage));

          reject(new Error(errorMessage));
        });
    });
  }

  private async testApiAttainability<T>(endpoint: string): Promise<T> {
    try {
      const response = await axios.get(endpoint);
      return response.data;
    } catch (e) {
      throw new Error(`Request to "${endpoint}" failed:` + e);
    }
  }

  private async setAuthorizationHeader(): Promise<void> {
    axios.interceptors.request.use(async config => {
      await this.keycloakAuthService.updateToken(5, config);
      return config;
    });
  }
}
