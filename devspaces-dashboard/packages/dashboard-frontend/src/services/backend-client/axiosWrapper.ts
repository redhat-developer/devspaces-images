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

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { delay } from '../helpers/delay';

const retryCount = 3;
const retryDelay = 500;

type AxiosFunc = (url: string, config?: AxiosRequestConfig) => Promise<any>;
type AxiosFuncWithData = (url: string, data?: any, config?: AxiosRequestConfig) => Promise<any>;

export class AxiosWrapper {
  protected readonly axiosInstance: AxiosInstance;

  constructor(axiosInstance?: AxiosInstance) {
    this.axiosInstance = axiosInstance || axios.create();
  }

  static create(): AxiosWrapper {
    return new AxiosWrapper();
  }

  get<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
    return this.retryAxiosFunc(this.axiosInstance.get, url, config);
  }

  delete<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
    return this.retryAxiosFunc(this.axiosInstance.delete, url, config);
  }

  post<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.retryAxiosFuncWithData(this.axiosInstance.post, url, data, config);
  }

  put<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.retryAxiosFuncWithData(this.axiosInstance.put, url, data, config);
  }

  patch<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.retryAxiosFuncWithData(this.axiosInstance.patch, url, data, config);
  }

  private retryAxiosFunc<T = any, R = AxiosResponse<T>>(
    axiosFunc: AxiosFunc,
    url: string,
    config?: any,
  ): Promise<R> {
    return this.doRetryFunc(() => axiosFunc(url, config), url, retryCount);
  }

  private retryAxiosFuncWithData<T = any, R = AxiosResponse<T>>(
    axiosFunc: AxiosFuncWithData,
    url: string,
    data?: string,
    config?: any,
  ): Promise<R> {
    return this.doRetryFunc(() => axiosFunc(url, data, config), url, retryCount);
  }

  async doRetryFunc<T = any, R = AxiosResponse<T>>(
    fun: () => Promise<R>,
    url: string,
    retry: number,
  ): Promise<R> {
    try {
      return await fun();
    } catch (err) {
      if (!retry || !(err as Error)?.message?.includes('Bearer Token Authorization is required')) {
        throw err;
      }

      // Retry the request after a delay.
      console.warn(`Retrying request ${url}... ${retry} left`);
      await delay(retryDelay);

      return await this.doRetryFunc(fun, url, --retry);
    }
  }
}
