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

import * as https from 'https';
import * as tunnel from 'tunnel';
import * as url from 'url';
import { CertsProvider } from './CertsProvider';

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class CheAxiosFactory {
  private certsProvider: CertsProvider;

  constructor() {
    this.certsProvider = new CertsProvider();
  }

  /**
   * Use proxy and/or certificates.
   */
  public async getAxiosInstance(uri: string): Promise<AxiosInstance> {
    const certificateAuthority = await this.certsProvider.getCertificateAuthority();

    const proxyUrl = process.env.HTTP_PROXY || process.env.http_proxy;
    if (proxyUrl && proxyUrl !== '') {
      const parsedUrl = new url.URL(uri);
      if (parsedUrl.hostname && this.shouldProxy(parsedUrl.hostname)) {
        const axiosRequestConfig: AxiosRequestConfig | undefined = {
          proxy: false,
        };
        const parsedProxyUrl = new url.URL(proxyUrl);
        const mainProxyOptions = CheAxiosFactory.getMainProxyOptions(parsedProxyUrl);
        const httpsProxyOptions = CheAxiosFactory.getHttpsProxyOptions(
          mainProxyOptions,
          parsedUrl.hostname,
          certificateAuthority,
        );
        const httpOverHttpAgent = tunnel.httpOverHttp({ proxy: mainProxyOptions });
        const httpOverHttpsAgent = tunnel.httpOverHttps({ proxy: httpsProxyOptions });
        const httpsOverHttpAgent = tunnel.httpsOverHttp({
          proxy: mainProxyOptions,
          ca: certificateAuthority ? certificateAuthority : undefined,
        });
        const httpsOverHttpsAgent = tunnel.httpsOverHttps({
          proxy: httpsProxyOptions,
          ca: certificateAuthority ? certificateAuthority : undefined,
        });
        const urlIsHttps = (parsedUrl.protocol || 'http:').startsWith('https:');
        const proxyIsHttps = (parsedProxyUrl.protocol || 'http:').startsWith('https:');
        if (urlIsHttps) {
          axiosRequestConfig.httpsAgent = proxyIsHttps ? httpsOverHttpsAgent : httpsOverHttpAgent;
        } else {
          axiosRequestConfig.httpAgent = proxyIsHttps ? httpOverHttpsAgent : httpOverHttpAgent;
        }
        return axios.create(axiosRequestConfig);
      }
    }

    if (uri.startsWith('https') && certificateAuthority) {
      return axios.create({
        httpsAgent: new https.Agent({
          ca: certificateAuthority,
        }),
      });
    }

    return axios;
  }

  private static getHttpsProxyOptions(
    mainProxyOptions: tunnel.ProxyOptions,
    servername: string | undefined,
    certificateAuthority: Buffer[] | undefined,
  ): tunnel.HttpsProxyOptions {
    return {
      host: mainProxyOptions.host,
      port: mainProxyOptions.port,
      proxyAuth: mainProxyOptions.proxyAuth,
      servername,
      ca: certificateAuthority ? certificateAuthority : undefined,
    };
  }

  private static getMainProxyOptions(parsedProxyUrl: url.URL): tunnel.ProxyOptions {
    const port = Number(parsedProxyUrl.port);
    const { username, password } = parsedProxyUrl;
    // 'user:pass' or simply 'user'
    const proxyAuth =
      username && password ? `${username}:${password}` : username ? username : undefined;
    return {
      host: parsedProxyUrl.hostname,
      port: parsedProxyUrl.port !== '' && !isNaN(port) ? port : 3128,
      proxyAuth,
    };
  }

  private shouldProxy(hostname: string): boolean {
    const noProxyEnv = process.env.no_proxy || process.env.NO_PROXY;
    const noProxy: string[] = noProxyEnv ? noProxyEnv.split(',').map(s => s.trim()) : [];
    return !noProxy.some(rule => {
      if (!rule) {
        return false;
      }
      if (rule === '*') {
        return true;
      }
      if (rule[0] === '.' && hostname.substr(hostname.length - rule.length) === rule) {
        return true;
      }
      return hostname === rule;
    });
  }
}
